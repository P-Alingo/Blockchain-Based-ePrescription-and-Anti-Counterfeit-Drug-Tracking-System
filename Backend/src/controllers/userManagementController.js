import dotenv from 'dotenv';
import { ethers } from 'ethers';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Load contract artifacts ----
const artifactPath = path.resolve(
  __dirname,
  '../../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json'
);

if (!fs.existsSync(artifactPath)) {
  console.error('❌ Contract JSON not found at:', artifactPath);
  process.exit(1);
}

const userManagementArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// ---- Database Client ----
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => console.log('✅ DB connected'))
  .catch((err) => console.error('❌ DB connection error:', err));

// ---- Blockchain Setup ----
let provider, wallet, userManagement;

try {
  provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  userManagement = new ethers.Contract(
    process.env.USER_MANAGEMENT_ADDRESS,
    userManagementArtifact.abi,
    wallet
  );
  console.log('✅ Blockchain setup completed');
} catch (error) {
  console.error('❌ Blockchain setup failed:', error.message);
  process.exit(1);
}

// ---- Helpers ----
const log = (msg) => console.log(msg);

// Convert DB status string to Solidity enum index
const statusToEnum = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return 0;
    case 'active': return 1;
    case 'suspended': return 2;
    default: throw new Error('Invalid status string');
  }
};

// Check if is_deleted column exists
const checkIsDeletedColumnExists = async () => {
  try {
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='is_deleted'
    `);
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking is_deleted column:', error);
    return false;
  }
};

// Contract connection verification
const verifyContractConnection = async () => {
  try {
    const roleCounter = await userManagement.roleCounter();
    console.log('✅ Contract connection verified. Role counter:', roleCounter.toString());
    return true;
  } catch (error) {
    console.error('❌ Contract connection failed:', error.message);
    return false;
  }
};

// Check if user exists on blockchain - FIXED VERSION
const checkUserExistsOnChain = async (walletAddress) => {
  try {
    // Try to get user role - if this succeeds, user exists
    const role = await userManagement.getUserRole(walletAddress);
    console.log(`✅ User ${walletAddress} exists on chain with role: ${role}`);
    return true;
  } catch (error) {
    // After fixing the contract, suspended users should still exist
    // So this error should only occur for truly non-existent users
    if (error.reason === 'User does not exist') {
      console.log(`❌ User ${walletAddress} does not exist on blockchain`);
      return false;
    }
    console.error(`⚠️ Error checking user existence: ${error.message}`);
    throw error;
  }
};

// Get user status from blockchain
const getUserStatusFromChain = async (walletAddress) => {
  try {
    const status = await userManagement.getUserStatus(walletAddress);
    console.log(`📊 On-chain status for ${walletAddress}: ${status}`);
    return status;
  } catch (error) {
    console.error(`❌ Cannot get user status from chain: ${error.message}`);
    return null;
  }
};

// Get or create roleId on-chain with enhanced error handling
const getOrCreateRoleId = async (roleName) => {
  try {
    const isConnected = await verifyContractConnection();
    if (!isConnected) {
      throw new Error('Contract connection unavailable');
    }

    const totalRoles = await userManagement.roleCounter();
    let roleId = 0;

    // Search for existing role
    for (let i = 1; i <= totalRoles; i++) {
      try {
        const name = await userManagement.getRoleName(i);
        if (name.toLowerCase() === roleName.toLowerCase()) {
          roleId = i;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch role ${i}, continuing...`);
        continue;
      }
    }

    // Create role if not found
    if (roleId === 0) {
      console.log(`📝 Creating new role: ${roleName}`);
      const tx = await userManagement.createRole(roleName.toLowerCase(), {
        gasLimit: 300000
      });
      const receipt = await tx.wait();
      console.log(`✅ Role created in block ${receipt.blockNumber}`);
      
      roleId = await userManagement.roleCounter();
    }

    console.log(`✅ Using role ID ${roleId} for ${roleName}`);
    return roleId;
  } catch (error) {
    console.error('❌ getOrCreateRoleId failed:', error);
    throw error;
  }
};

// Register user on blockchain
const registerUserOnChain = async (walletAddress, roleId) => {
  try {
    console.log(`📝 Registering user ${walletAddress} with role ${roleId}`);
    
    // Check if user already exists
    const userExists = await checkUserExistsOnChain(walletAddress);
    if (userExists) {
      console.log(`✅ User ${walletAddress} already registered`);
      return true;
    }

    // Register new user
    const tx = await userManagement.registerUser(walletAddress, roleId, {
      gasLimit: 500000
    });
    const receipt = await tx.wait();
    console.log(`✅ User registered in block ${receipt.blockNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ User registration failed for ${walletAddress}:`, error.message);
    
    if (error.reason === 'User already registered') {
      console.log(`✅ User was already registered (race condition)`);
      return true;
    }
    
    throw error;
  }
};

// Update user status on blockchain
const updateUserStatusOnChain = async (walletAddress, statusEnum) => {
  try {
    console.log(`🔄 Updating status for ${walletAddress} to ${statusEnum}`);
    
    // Verify user exists before updating status
    const userExists = await checkUserExistsOnChain(walletAddress);
    if (!userExists) {
      throw new Error(`Cannot update status: User ${walletAddress} not registered on blockchain`);
    }

    const tx = await userManagement.updateUserStatus(walletAddress, statusEnum, {
      gasLimit: 300000
    });
    const receipt = await tx.wait();
    console.log(`✅ Status updated in block ${receipt.blockNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ Status update failed for ${walletAddress}:`, error.message);
    throw error;
  }
};

// Enhanced sync user on blockchain
const syncUserOnChain = async (user) => {
  if (!user.wallet_address) {
    console.log('⚠️ No wallet address, skipping blockchain sync');
    return;
  }

  try {
    console.log(`\n🔄 Starting blockchain sync for user: ${user.full_name} (${user.wallet_address})`);
    console.log(`📊 User details - Role: ${user.role}, Status: ${user.status}`);

    const roleId = await getOrCreateRoleId(user.role);
    const statusEnum = statusToEnum(user.status);

    // Step 1: Check current on-chain state
    const userExists = await checkUserExistsOnChain(user.wallet_address);
    const currentStatus = userExists ? await getUserStatusFromChain(user.wallet_address) : 'not-registered';

    console.log(`📋 Sync Plan:`);
    console.log(`   - On-chain exists: ${userExists}`);
    console.log(`   - Current status: ${currentStatus}`);
    console.log(`   - Target status: ${user.status}`);

    // Step 2: Register user if not exists
    if (!userExists) {
      console.log(`\n📝 User not registered, registering now...`);
      await registerUserOnChain(user.wallet_address, roleId);
    } else {
      console.log(`✅ User already registered, skipping registration`);
    }

    // Step 3: Update status if needed
    if (userExists && currentStatus === user.status.toLowerCase()) {
      console.log(`✅ Status already matches target (${user.status}), skipping update`);
    } else {
      console.log(`\n🔄 Updating status to ${user.status}...`);
      await updateUserStatusOnChain(user.wallet_address, statusEnum);
    }

    // Step 4: Verify final state
    const finalStatus = await getUserStatusFromChain(user.wallet_address);
    console.log(`\n✅ Sync completed for ${user.full_name}`);
    console.log(`   Final on-chain status: ${finalStatus}`);
    console.log(`   Target status: ${user.status}`);
    
    if (finalStatus === user.status.toLowerCase()) {
      log(`🎉 User ${user.full_name} successfully synced on-chain`);
    } else {
      console.warn(`⚠️ Status mismatch: Expected ${user.status}, got ${finalStatus}`);
    }

  } catch (error) {
    console.error('❌ syncUserOnChain failed:', error);
    
    // Enhanced error messages
    if (error.message.includes('User does not exist')) {
      throw new Error(`User needs to be registered on blockchain first. Try manual sync.`);
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction gas costs');
    } else if (error.reason) {
      throw new Error(`Blockchain error: ${error.reason}`);
    }
    
    throw error;
  }
};

// ===========================
// Controller Functions
// ===========================

// Get all users (exclude deleted by default)
export const getAllUsers = async (req, res) => {
  try {
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    const includeDeleted = req.query.includeDeleted === 'true';
    
    let query = 'SELECT * FROM users';
    let params = [];
    
    if (hasIsDeletedColumn && !includeDeleted) {
      query += ' WHERE is_deleted = FALSE';
    }
    
    query += ' ORDER BY createdat DESC';
    
    const { rows } = await client.query(query, params);
    
    // Sanitize deleted user data
    const sanitizedUsers = hasIsDeletedColumn ? rows.map(user => ({
      ...user,
      email: user.is_deleted ? '[DELETED]' : user.email,
      phone_number: user.is_deleted ? '[DELETED]' : user.phone_number,
      wallet_address: user.is_deleted ? '[DELETED]' : user.wallet_address
    })) : rows;
    
    res.json({ 
      success: true, 
      users: sanitizedUsers,
      hasSoftDelete: hasIsDeletedColumn
    });
  } catch (err) {
    console.error('❌ getAllUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Get single user
export const getUserById = async (req, res) => {
  try {
    const { rows } = await client.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    let user = rows[0];
    
    // Sanitize if user is deleted
    if (hasIsDeletedColumn && user.is_deleted) {
      user = {
        ...user,
        email: '[DELETED]',
        phone_number: '[DELETED]',
        wallet_address: '[DELETED]'
      };
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ getUserById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// Search users (exclude deleted)
export const searchUsers = async (req, res) => {
  const term = req.query.query;
  if (!term) return res.status(400).json({ success: false, message: 'Query is required' });

  try {
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    let query = `SELECT * FROM users 
                 WHERE (full_name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1)`;
    let params = [`%${term}%`];
    
    if (hasIsDeletedColumn) {
      query += ' AND is_deleted = FALSE';
    }
    
    query += ' ORDER BY createdat DESC';

    const { rows } = await client.query(query, params);

    if (!rows.length) return res.status(404).json({ success: false, message: 'No users found' });
    
    res.json({ success: true, users: rows });
  } catch (err) {
    console.error('❌ searchUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

// Add new user (status pending)
export const addUser = async (req, res) => {
  const { full_name, email, role, wallet_address } = req.body;
  if (!full_name || !email || !role || !wallet_address)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  try {
    // Validate wallet address format
    if (!ethers.utils.isAddress(wallet_address)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format' });
    }

    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    let query, params;
    if (hasIsDeletedColumn) {
      query = `INSERT INTO users (full_name, email, role, wallet_address, status, is_deleted, createdat, updatedat)
               VALUES ($1,$2,$3,$4,'pending',false,NOW(),NOW()) RETURNING *`;
      params = [full_name, email, role, wallet_address];
    } else {
      query = `INSERT INTO users (full_name, email, role, wallet_address, status, createdat, updatedat)
               VALUES ($1,$2,$3,$4,'pending',NOW(),NOW()) RETURNING *`;
      params = [full_name, email, role, wallet_address];
    }

    const { rows } = await client.query(query, params);

    res.json({ success: true, user: rows[0], message: 'User added with status pending' });
  } catch (err) {
    console.error('❌ addUser error:', err);
    
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'User with this email or wallet already exists' });
    }
    
    res.status(500).json({ success: false, message: 'Failed to add user' });
  }
};

// Update user and optionally sync to blockchain
export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  
  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  try {
    const allowed = ['full_name','email','role','wallet_address','phone_number','gender','dob','user_code','status'];
    const fields = Object.keys(updates).filter(k => allowed.includes(k));
    const values = fields.map(f => updates[f]);
    const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
    const sql = `UPDATE users SET ${setClause}, updatedat=NOW() WHERE id=$${values.length + 1} RETURNING *`;
    values.push(userId);

    const { rows } = await client.query(sql, values);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const user = rows[0];
    
    // Only sync to blockchain if wallet address exists and status/role changed
    if (user.wallet_address && (updates.status || updates.role)) {
      try {
        await syncUserOnChain(user);
        return res.json({ success: true, user, message: 'User updated and blockchain synced' });
      } catch (blockchainError) {
        console.error('❌ Blockchain sync failed during update:', blockchainError);
        return res.json({ 
          success: true, 
          user, 
          message: 'User updated but blockchain sync failed',
          warning: blockchainError.message 
        });
      }
    }

    res.json({ success: true, user, message: 'User updated' });
  } catch (err) {
    console.error('❌ updateUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// Manual blockchain sync
export const syncUserToBlockchain = async (req, res) => {
  const userId = req.params.id;

  try {
    const { rows } = await client.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    
    if (!user.wallet_address) {
      return res.status(400).json({ 
        success: false, 
        message: 'User has no wallet address for blockchain sync' 
      });
    }

    // Verify contract connection before proceeding
    const isConnected = await verifyContractConnection();
    if (!isConnected) {
      return res.status(500).json({ 
        success: false, 
        message: 'Blockchain connection unavailable' 
      });
    }

    console.log(`\n🎯 Manual blockchain sync requested for user ${user.full_name}`);

    // Update user status to active in database first
    const { rows: updatedRows } = await client.query(
      'UPDATE users SET status=$1, updatedat=NOW() WHERE id=$2 RETURNING *',
      ['active', userId]
    );

    const updatedUser = updatedRows[0];
    
    // Sync to blockchain
    await syncUserOnChain(updatedUser);

    res.json({ 
      success: true, 
      user: updatedUser, 
      message: 'User set to active and successfully synced on blockchain' 
    });
  } catch (err) {
    console.error('❌ syncUserToBlockchain error:', err);
    
    let errorMessage = 'Failed to sync user to blockchain';
    let solution = 'Please check the user has a valid wallet address';
    
    if (err.message.includes('User does not exist')) {
      errorMessage = 'User not registered on blockchain';
      solution = 'The user needs to be registered first. Try the sync operation again.';
    } else if (err.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for blockchain transaction';
      solution = 'Add more ETH to the admin wallet for gas fees';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      detail: err.message,
      solution: solution
    });
  }
};

// Delete user - soft delete with blockchain suspension
export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    let query, params;
    
    if (hasIsDeletedColumn) {
      // Soft delete - mark as deleted instead of removing
      query = 'UPDATE users SET is_deleted = TRUE, status = $1, updatedat = NOW() WHERE id = $2 RETURNING *';
      params = ['suspended', userId];
    } else {
      // Fallback to hard delete if column doesn't exist
      query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      params = [userId];
    }

    const { rows } = await client.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];

    // Update blockchain status to suspended
    if (user.wallet_address) {
      try {
        const isConnected = await verifyContractConnection();
        if (isConnected) {
          const userExists = await checkUserExistsOnChain(user.wallet_address);
          if (userExists) {
            await updateUserStatusOnChain(user.wallet_address, statusToEnum('suspended'));
            console.log(`✅ User ${user.full_name} suspended on blockchain`);
          }
        }
      } catch (blockchainError) {
        console.error('❌ Blockchain suspension failed:', blockchainError.message);
        // Continue with deletion even if blockchain update fails
      }
    }

    const response = {
      success: true, 
      message: hasIsDeletedColumn 
        ? 'User soft deleted and suspended on blockchain' 
        : 'User deleted from database',
      user: hasIsDeletedColumn ? {
        ...user,
        // Sanitize sensitive information for deleted users
        email: user.is_deleted ? '[DELETED]' : user.email,
        phone_number: user.is_deleted ? '[DELETED]' : user.phone_number,
        wallet_address: user.is_deleted ? '[DELETED]' : user.wallet_address
      } : user
    };

    res.json(response);
  } catch (err) {
    console.error('❌ deleteUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// Restore soft-deleted user
export const restoreUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    if (!hasIsDeletedColumn) {
      return res.status(400).json({ 
        success: false, 
        message: 'Soft delete not enabled. is_deleted column does not exist.' 
      });
    }

    const { rows } = await client.query(
      'UPDATE users SET is_deleted = FALSE, status = $1, updatedat = NOW() WHERE id = $2 RETURNING *',
      ['active', userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];

    // Reactivate on blockchain if needed
    if (user.wallet_address) {
      try {
        const isConnected = await verifyContractConnection();
        if (isConnected) {
          const userExists = await checkUserExistsOnChain(user.wallet_address);
          if (userExists) {
            await updateUserStatusOnChain(user.wallet_address, statusToEnum('active'));
            console.log(`✅ User ${user.full_name} reactivated on blockchain`);
          }
        }
      } catch (blockchainError) {
        console.error('❌ Blockchain reactivation failed:', blockchainError.message);
      }
    }

    res.json({ 
      success: true, 
      message: 'User restored successfully',
      user: rows[0]
    });
  } catch (err) {
    console.error('❌ restoreUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to restore user' });
  }
};

// Get deleted users (admin only)
export const getDeletedUsers = async (req, res) => {
  try {
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    if (!hasIsDeletedColumn) {
      return res.status(400).json({ 
        success: false, 
        message: 'Soft delete not enabled. is_deleted column does not exist.' 
      });
    }

    const { rows } = await client.query(
      'SELECT * FROM users WHERE is_deleted = TRUE ORDER BY updatedat DESC'
    );
    
    // Sanitize sensitive information
    const sanitizedUsers = rows.map(user => ({
      ...user,
      email: '[DELETED]',
      phone_number: '[DELETED]',
      wallet_address: '[DELETED]'
    }));
    
    res.json({ 
      success: true, 
      users: sanitizedUsers,
      message: `Found ${rows.length} deleted users`
    });
  } catch (err) {
    console.error('❌ getDeletedUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch deleted users' });
  }
};

// Health check endpoint for blockchain connectivity
export const healthCheck = async (req, res) => {
  try {
    const dbConnected = !client._ending;
    const blockchainConnected = await verifyContractConnection();
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    res.json({
      success: true,
      database: dbConnected ? 'connected' : 'disconnected',
      blockchain: blockchainConnected ? 'connected' : 'disconnected',
      softDeleteEnabled: hasIsDeletedColumn,
      contractAddress: process.env.USER_MANAGEMENT_ADDRESS,
      adminAddress: wallet.address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// Get user's blockchain status
export const getUserBlockchainStatus = async (req, res) => {
  const userId = req.params.id;

  try {
    const { rows } = await client.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    
    if (!user.wallet_address) {
      return res.json({
        success: true,
        wallet_address: null,
        blockchain_status: 'no_wallet',
        message: 'User has no wallet address'
      });
    }

    const isConnected = await verifyContractConnection();
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain connection unavailable'
      });
    }

    const userExists = await checkUserExistsOnChain(user.wallet_address);
    const blockchainStatus = userExists ? await getUserStatusFromChain(user.wallet_address) : 'not_registered';

    res.json({
      success: true,
      wallet_address: user.wallet_address,
      blockchain_status: blockchainStatus,
      database_status: user.status,
      is_synced: userExists && blockchainStatus === user.status.toLowerCase(),
      message: userExists ? 
        `User found on blockchain with status: ${blockchainStatus}` :
        'User not registered on blockchain'
    });
  } catch (error) {
    console.error('❌ getUserBlockchainStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
};