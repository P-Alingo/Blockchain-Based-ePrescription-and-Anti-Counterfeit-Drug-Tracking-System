export const updateUserTxInfo = async (userId, txHash, blockNumber) => {
  // No longer needed: transaction_hash and block_number columns removed
  return;
};
// Log user view action to blockchain event log
export const logUserViewEvent = async (userId, walletAddress, txHash, blockNumber) => {
  // Prevent duplicate transaction hash insert
  const { rows } = await query(
    'SELECT id FROM blockchaineventlog WHERE transactionhash = $1',
    [txHash]
  );
  if (rows.length > 0) {
    // Already logged, skip
    return;
  }
  await query(
    `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, processed)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    ['UserViewed', 'UserManagement', userId, 'user', txHash, true]
  );
};
// Example usage in a controller/service when a user is viewed
// (You should call this after a successful blockchain event for viewing a user)
// await logUserViewEvent(user.id, user.wallet_address, receipt.transactionHash, receipt.blockNumber);
import { query } from "../config/database.js";
import * as blockchainService from "./blockchainService.js";
import { ethers } from 'ethers';

// ===========================
// USER MANAGEMENT SERVICES
// ===========================
// Bulk sync all users to blockchain
export const syncAllUsersToBlockchain = async () => {
  const users = await getAllUsers(false);
  const results = [];
  for (const user of users) {
    if (!user.wallet_address || user.is_deleted) {
      results.push({ id: user.id, status: 'skipped', reason: 'No wallet or deleted' });
      continue;
    }
    try {
      const { checkUserExistsOnChain, addUserToBlockchain, getContract } = await import("./blockchainService.js");
      const contract = getContract();
      let exists = await checkUserExistsOnChain(user.wallet_address);
      if (!exists) {
        // Register user on-chain
        const regResult = await addUserToBlockchain(user.wallet_address, user.role || 'doctor');
        if (!regResult || !regResult.transactionHash || !regResult.blockNumber) {
          results.push({ id: user.id, status: 'error', reason: 'Registration failed' });
          continue;
        }
        exists = true;
      }
      // Get on-chain status
      let onChainStatus = 'pending';
      if (typeof contract.getUserStatusString === 'function') {
        onChainStatus = await contract.getUserStatusString(user.wallet_address);
      }
      // Approve if DB is active and on-chain is pending
      if (user.status === 'active' && onChainStatus === 'pending' && typeof contract.approveUser === 'function') {
        const tx = await contract.approveUser(user.wallet_address);
        await tx.wait();
        results.push({ id: user.id, status: 'synced', action: 'approved' });
      } else {
        results.push({ id: user.id, status: 'synced', action: 'no action needed' });
      }
    } catch (err) {
      results.push({ id: user.id, status: 'error', reason: err.message });
    }
  }
  return results;
};
// Approve user (admin action: pending -> active)
export const approveUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user.wallet_address) throw new Error("User has no wallet address");
  if (user.status !== 'pending') throw new Error("User is not pending");
  const { contract, getUserStatusFromChain, checkUserExistsOnChain, addUserToBlockchain, getOrCreateRoleId } = await import("./blockchainService.js");
  let tx, receipt;
  try {
    // Check if user exists on-chain
    const exists = await checkUserExistsOnChain(user.wallet_address);
    if (!exists) {
      // Register user on-chain first
      const roleName = user.role || 'doctor';
      await addUserToBlockchain(user.wallet_address, roleName);
    }
    console.log(`[approveUser] Calling contract.approveUser for wallet: ${user.wallet_address}`);
    tx = await contract.approveUser(user.wallet_address);
    console.log(`[approveUser] Sent transaction: ${tx.hash}`);
    receipt = await tx.wait();
    console.log(`[approveUser] Transaction mined. Receipt:`, receipt);
    if (!receipt || !receipt.transactionHash) throw new Error("No transaction receipt received");
    // Log event to blockchaineventlog (prevent duplicate tx hash)
    const { rows: existing } = await query(
      'SELECT id FROM blockchaineventlog WHERE transactionhash = $1',
      [receipt.transactionHash]
    );
    if (existing.length === 0) {
      await query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, processed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['UserApproved', 'UserManagement', user.id, 'user', receipt.transactionHash, true]
      );
    }
    // Fetch latest blockchain status after approval
    let latestStatus = 'pending';
    try {
      const statusEnum = await getUserStatusFromChain(user.wallet_address);
      console.log(`[approveUser] Blockchain status enum after approval:`, statusEnum);
      switch (statusEnum?.toString()) {
        case '1': latestStatus = 'active'; break;
        case '0': latestStatus = 'pending'; break;
        case '2': latestStatus = 'suspended'; break;
        default: latestStatus = 'pending';
      }
      console.log(`[approveUser] Latest status after approval:`, latestStatus);
    } catch (statusErr) {
      console.error(`[approveUser] Error fetching blockchain status after approval:`, statusErr);
      // fallback: keep as pending
    }
    // Update user status only (tx info now in blockchaineventlog)
    await query(
      `UPDATE users SET status = $1, updatedat = NOW() WHERE id = $2`,
      [latestStatus, userId]
    );
    console.log(`[approveUser] Updated DB for userId ${userId} with status: ${latestStatus}, tx: ${receipt.transactionHash}, block: ${receipt.blockNumber}`);
  } catch (err) {
    console.error(`[approveUser] Error in approval flow:`, err);
    throw new Error("Blockchain transaction failed: " + err.message);
  }
  return { txHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
};

// Get all users (exclude deleted by default)
export const getAllUsers = async (includeDeleted = false) => {
  let sql = 'SELECT * FROM users';
  if (!includeDeleted) {
    sql += ' WHERE is_deleted = FALSE OR is_deleted IS NULL';
  }
  sql += ' ORDER BY createdat DESC';
  
  const { rows } = await query(sql);
  
  // Map role ID to role name if needed
  const sanitizedUsers = await Promise.all(rows.map(async user => {
    let roleName = user.role;
    if (user.role && !isNaN(user.role)) {
      try {
        const { contract } = require("./blockchainService.js");
        roleName = await contract.getRoleName(Number(user.role));
      } catch (err) {
        roleName = user.role;
      }
    }
    return {
      ...user,
      role: roleName,
      email: user.is_deleted ? '[DELETED]' : user.email,
      phone_number: user.is_deleted ? '[DELETED]' : user.phone_number,
      wallet_address: user.is_deleted ? '[DELETED]' : user.wallet_address,
      last_viewed_at: user.last_viewed_at,
      last_edited_at: user.last_edited_at,
      last_deleted_at: user.last_deleted_at,
      last_synced_at: user.last_synced_at,
      last_tx_hash: user.last_tx_hash,
      last_block_number: user.last_block_number
    };
  }));
  return sanitizedUsers;
};

// Get single user by ID
export const getUserById = async (id) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (!rows.length) throw new Error('User not found');

  let user = rows[0];
  // Map role ID to role name if needed
  if (user.role && !isNaN(user.role)) {
    try {
      const { contract } = require("./blockchainService.js");
      user.role = await contract.getRoleName(Number(user.role));
    } catch (err) {
      // fallback to role ID
    }
  }
  // Sanitize if user is deleted
  if (user.is_deleted) {
    user.email = '[DELETED]';
    user.phone_number = '[DELETED]';
    user.wallet_address = '[DELETED]';
  }
  // Enhance with blockchain data if wallet exists
  if (user.wallet_address && !user.is_deleted) {
    try {
      const blockchainData = await blockchainService.getUserOnChain(user.wallet_address);
      user.blockchain = blockchainData;
    } catch (error) {
      user.blockchain = { error: error.message };
    }

    // Always ensure transaction_hash and block_number are present
    if (!user.transaction_hash || !user.block_number) {
      // Query blockchain events for latest tx/block
      let txHash = null;
      let blockNumber = null;
      // Get latest UserRegistered event for this wallet
      try {
        const regEvents = await blockchainService.getPastEvents('UserRegistered', 0, 'latest');
        const regEvent = regEvents.success && regEvents.events
          ? regEvents.events.filter(e => e.userAddress?.toLowerCase() === user.wallet_address.toLowerCase()).pop()
          : null;
        if (regEvent) {
          txHash = regEvent.transactionHash;
          blockNumber = regEvent.blockNumber;
        }
        // Get latest UserStatusUpdated event for this wallet
        const statusEvents = await blockchainService.getPastEvents('UserStatusUpdated', 0, 'latest');
        const statusEvent = statusEvents.success && statusEvents.events
          ? statusEvents.events.filter(e => e.userAddress?.toLowerCase() === user.wallet_address.toLowerCase()).pop()
          : null;
        if (statusEvent && statusEvent.transactionHash && statusEvent.blockNumber) {
          // Prefer status update tx/block if more recent
          if (!blockNumber || statusEvent.blockNumber > blockNumber) {
            txHash = statusEvent.transactionHash;
            blockNumber = statusEvent.blockNumber;
          }
        }
        // Merge into user object
        user.transaction_hash = txHash;
        user.block_number = blockNumber;
      } catch (eventErr) {
        // If event fetch fails, leave as null
      }
    }
  }
  return {
    ...user,
    last_viewed_at: user.last_viewed_at,
    last_edited_at: user.last_edited_at,
    last_deleted_at: user.last_deleted_at,
    last_synced_at: user.last_synced_at
  };
};

// Search users
export const searchUsers = async (term) => {
  const { rows } = await query(
    `SELECT * FROM users 
     WHERE (full_name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1)
     AND (is_deleted = FALSE OR is_deleted IS NULL)
     ORDER BY createdat DESC`,
    [`%${term}%`]
  );
  
  if (!rows.length) throw new Error('No users found');
  // Map role ID to role name if needed
  const mappedRows = await Promise.all(rows.map(async user => {
    let roleName = user.role;
    if (user.role && !isNaN(user.role)) {
      try {
        const { contract } = require("./blockchainService.js");
        roleName = await contract.getRoleName(Number(user.role));
      } catch (err) {
        roleName = user.role;
      }
    }
    return {
      ...user,
      role: roleName
    };
  }));
  return mappedRows;
};

// Create new user
export const createUser = async (userData) => {
  const { full_name, email, role, wallet_address } = userData;
  
  // Validate wallet address format
  if (wallet_address && !ethers.utils.isAddress(wallet_address)) {
    throw new Error('Invalid wallet address format');
  }

  const hasIsDeletedColumn = await checkIsDeletedColumnExists();
  
  let sql, params;
  if (hasIsDeletedColumn) {
    sql = `INSERT INTO users (full_name, email, role, wallet_address, status, is_deleted, createdat, updatedat)
           VALUES ($1, $2, $3, $4, 'pending', false, NOW(), NOW()) RETURNING *`;
    params = [full_name, email, role, wallet_address];
  } else {
    sql = `INSERT INTO users (full_name, email, role, wallet_address, status, createdat, updatedat)
           VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW()) RETURNING *`;
    params = [full_name, email, role, wallet_address];
  }

  const { rows } = await query(sql, params);
  return rows[0];
};

// Update user
export const updateUser = async (id, updates) => {
  const allowedFields = ['full_name', 'email', 'role', 'wallet_address', 'phone_number', 'gender', 'dob', 'user_code', 'status'];
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k));

  if (fields.length === 0) throw new Error('No valid fields to update');

  // Fetch current user
  const currentUser = await getUserById(id);

  // If status or role is being changed, sync to blockchain
  // No longer needed: transaction_hash and block_number columns removed
  let blockchainTxHash = null, blockchainBlockNumber = null;
  if (currentUser.wallet_address && !currentUser.is_deleted) {
    const { checkUserExistsOnChain, addUserToBlockchain, getOrCreateRoleId, getContract, getUserStatusFromChain } = await import("./blockchainService.js");
    const contract = getContract();
    // Ensure user exists on-chain before any blockchain action
    const exists = await checkUserExistsOnChain(currentUser.wallet_address);
    if (!exists) {
      // Register user on-chain first
      const roleName = currentUser.role || 'doctor';
      const regResult = await addUserToBlockchain(currentUser.wallet_address, roleName);
      if (!regResult || !regResult.transactionHash || !regResult.blockNumber) {
        throw new Error('Blockchain registration failed: No transaction receipt. User not registered on-chain.');
      }
      blockchainTxHash = regResult?.transactionHash || null;
      blockchainBlockNumber = regResult?.blockNumber || null;
    }
    // Status change
    if (updates.status && updates.status !== currentUser.status) {
      let tx, receipt;
      // Fetch on-chain status before attempting blockchain update
      const onChainStatus = await getUserStatusFromChain(currentUser.wallet_address);
      if (updates.status === 'active' && currentUser.status === 'pending') {
        if (onChainStatus === 'pending') {
          // Approve user on chain
          tx = await contract.approveUser(currentUser.wallet_address);
          receipt = await tx.wait();
        } else {
          // Skip blockchain call, user not pending on-chain
          receipt = null;
        }
      } else if (updates.status === 'suspended' && currentUser.status === 'active') {
        if (onChainStatus === 'active') {
          tx = await contract.suspendUser(currentUser.wallet_address);
          receipt = await tx.wait();
        } else {
          receipt = null;
        }
      } else if (updates.status === 'inactive' && currentUser.status === 'active') {
        if (onChainStatus === 'active') {
          tx = await contract.suspendUser(currentUser.wallet_address);
          receipt = await tx.wait();
        } else {
          receipt = null;
        }
      } else if (updates.status === 'active' && (currentUser.status === 'inactive' || currentUser.status === 'suspended')) {
        if (onChainStatus === 'inactive' || onChainStatus === 'suspended') {
          tx = await contract.reactivateUser(currentUser.wallet_address);
          receipt = await tx.wait();
        } else {
          receipt = null;
        }
      }
      if (receipt && receipt.transactionHash) {
        blockchainTxHash = receipt.transactionHash;
        blockchainBlockNumber = receipt.blockNumber;
      }
    }
    // Role change
    if (updates.role && updates.role !== currentUser.role) {
      // Get roleId from contract
      const roleId = await contract.getRoleIdByName(updates.role);
      const tx = await contract.updateUserRole(currentUser.wallet_address, roleId);
      const receipt = await tx.wait();
      if (receipt && receipt.transactionHash) {
        blockchainTxHash = receipt.transactionHash;
        blockchainBlockNumber = receipt.blockNumber;
      }
    }
    // If wallet address is changed, you may want to handle re-registration (not covered here)
  }

  // Update DB after blockchain transaction (if any)
  const values = fields.map(f => updates[f]);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
  let sql = `UPDATE users SET ${setClause}, updatedat=NOW()`;
  let params = [...values];
  sql += ` WHERE id=$${params.length + 1} RETURNING *`;
  params.push(id);

  const { rows } = await query(sql, params);
  if (!rows.length) throw new Error('User not found after update');
  // Only log blockchain event if txHash and blockNumber are present
  if (blockchainTxHash && blockchainBlockNumber) {
    // You may want to log the event here, e.g. to blockchaineventlog
    // await logBlockchainEvent(userId, blockchainTxHash, blockchainBlockNumber);
  }
  return rows[0];
};

// Delete user (soft delete)
export const deleteUser = async (id) => {
  const user = await getUserById(id);
  const hasIsDeletedColumn = await checkIsDeletedColumnExists();
  // No longer needed: transaction_hash and block_number columns removed
  if (user.wallet_address) {
    let blockchainTxHash = null, blockchainBlockNumber = null;
    const { deleteUserOnChain } = await import("./blockchainService.js");
    const existsOnChain = await blockchainService.checkUserExistsOnChain(user.wallet_address);
    if (!existsOnChain) {
      const roleId = await blockchainService.getOrCreateRoleId(user.role);
      const regTx = await blockchainService.registerUserOnChain(user.wallet_address, roleId);
      if (!regTx || !regTx.transactionHash) throw new Error("Blockchain registration failed");
    }
    let tx, receipt;
    try {
      tx = await deleteUserOnChain(user.wallet_address);
      receipt = await tx.wait();
      if (!receipt || !receipt.transactionHash) throw new Error("No transaction receipt received");
      blockchainTxHash = receipt.transactionHash;
      blockchainBlockNumber = receipt.blockNumber;
      // Log event to blockchaineventlog (prevent duplicate tx hash)
      try {
        const { rows: existing } = await query(
          'SELECT id FROM blockchaineventlog WHERE transactionhash = $1',
          [receipt.transactionHash]
        );
        if (existing.length === 0) {
          await query(
            `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, processed)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            ['UserDeleted', 'UserManagement', user.id, 'user', receipt.transactionHash, true]
          );
        }
      } catch (err) {
        // If duplicate, just skip insert
        if (!String(err.message).includes('duplicate key value')) throw err;
      }
    } catch (err) {
      throw new Error("Blockchain transaction failed: " + err.message);
    }
  }
  let result;
  if (hasIsDeletedColumn) {
    result = await query(
      'UPDATE users SET is_deleted = TRUE, status = $1, updatedat = NOW() WHERE id = $2 RETURNING *',
      ['suspended', id]
    );
  } else {
    result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  }
  if (!result.rows.length) throw new Error('User not found');
  const deletedUser = result.rows[0];
  // No longer needed: last_tx_hash and last_block_number columns removed
  return deletedUser;
};

// Restore soft-deleted user
export const restoreUser = async (id) => {
  const hasIsDeletedColumn = await checkIsDeletedColumnExists();
  if (!hasIsDeletedColumn) throw new Error("is_deleted column does not exist");
  const user = await getUserById(id);
  if (user.wallet_address) {
    const blockchainService = await import("./blockchainService.js");
    const contract = blockchainService.contract;
    if (!contract || typeof contract.restoreUser !== "function") {
      throw new Error("Contract instance or restoreUser function not available");
    }
    // Check on-chain user existence and status
    let onChainUser = null;
    try {
      onChainUser = await contract.getUser(user.wallet_address);
    } catch (err) {
      // If user does not exist on-chain, allow restore
      onChainUser = null;
    }
    if (onChainUser && onChainUser.exists) {
      // User already exists on-chain, cannot restore
      throw new Error("User already exists on-chain and cannot be restored. Approve instead if needed.");
    }
    let tx, receipt;
    try {
      tx = await contract.restoreUser(user.wallet_address);
      receipt = await tx.wait();
      if (!receipt || !receipt.transactionHash) throw new Error("No transaction receipt received");
      // Log event to blockchaineventlog (prevent duplicate tx hash)
      const { rows: existing } = await query(
        'SELECT id FROM blockchaineventlog WHERE transactionhash = $1',
        [receipt.transactionHash]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, processed, wallet_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          ['UserRestored', 'UserManagement', user.id, 'user', receipt.transactionHash, true, user.wallet_address]
        );
      }
    } catch (err) {
      throw new Error("Blockchain transaction failed: " + err.message);
    }
  }
  // Set status to pending after restore
  const { rows } = await query(
    'UPDATE users SET is_deleted = FALSE, status = $1, updatedat = NOW() WHERE id = $2 RETURNING *',
    ['pending', id]
  );
  if (!rows.length) throw new Error('User not found');
  const restoredUser = rows[0];
  return restoredUser;
};

// Get deleted users
export const getDeletedUsers = async () => {
  const hasIsDeletedColumn = await checkIsDeletedColumnExists();
  
  if (!hasIsDeletedColumn) {
    throw new Error('Soft delete not enabled. is_deleted column does not exist.');
  }

  const { rows } = await query(
    'SELECT * FROM users WHERE is_deleted = TRUE ORDER BY updatedat DESC'
  );
  
  // Sanitize sensitive information
  const sanitizedUsers = rows.map(user => ({
    ...user,
    email: '[DELETED]',
    phone_number: '[DELETED]',
    wallet_address: '[DELETED]'
  }));
  
  return sanitizedUsers;
};

// Sync user to blockchain manually
export const syncUserToBlockchain = async (id) => {
  const user = await getUserById(id);
  if (!user.wallet_address || user.is_deleted) {
    throw new Error('User has no wallet address or is deleted');
  }
  // Get contract instance and sync function from blockchainService
  const blockchainService = await import("./blockchainService.js");
  let tx, receipt;
  try {
    // Try contract.syncUser first
    const contract = blockchainService.getContract();
    if (contract && typeof contract.syncUser === 'function') {
      tx = await contract.syncUser(user.wallet_address);
      receipt = await tx.wait();
    } else if (typeof blockchainService.syncUserOnChainAction === 'function') {
      // Fallback to syncUserOnChainAction
      tx = await blockchainService.syncUserOnChainAction(user.wallet_address);
      receipt = await tx.wait();
    } else {
      throw new Error('No syncUser function available on contract or service');
    }
    if (!receipt || !receipt.transactionHash) throw new Error("No transaction receipt received");
    // Log event to blockchaineventlog (prevent duplicate tx hash)
    const { rows: existing } = await query(
      'SELECT id FROM blockchaineventlog WHERE transactionhash = $1',
      [receipt.transactionHash]
    );
    if (existing.length === 0) {
      await query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, processed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['UserSynced', 'UserManagement', user.id, 'user', receipt.transactionHash, true]
      );
    }

    // After syncing, update on-chain status to match database status
    // Only update if status transition is valid
    let onChainStatus = 'pending';
    if (typeof contract.getUserStatusString === 'function') {
      onChainStatus = await contract.getUserStatusString(user.wallet_address);
    }
    if (user.status === 'active' && onChainStatus === 'pending' && typeof contract.approveUser === 'function') {
      const tx2 = await contract.approveUser(user.wallet_address);
      await tx2.wait();
    } else if (user.status === 'suspended' && onChainStatus === 'active' && typeof contract.suspendUser === 'function') {
      const tx2 = await contract.suspendUser(user.wallet_address);
      await tx2.wait();
    } else if (user.status === 'inactive' && typeof contract.deactivateUser === 'function') {
      const tx2 = await contract.deactivateUser(user.wallet_address);
      await tx2.wait();
    }
  } catch (err) {
    throw new Error("Blockchain transaction failed: " + err.message);
  }
  return { txHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
};

// Get user's blockchain status
export const getUserBlockchainStatus = async (id) => {
  const user = await getUserById(id);
  
  if (!user.wallet_address || user.is_deleted) {
    return {
      wallet_address: null,
      blockchain_status: 'no_wallet',
      message: 'User has no wallet address or is deleted'
    };
  }

  const isConnected = await blockchainService.verifyContractConnection();
  if (!isConnected) {
    throw new Error('Blockchain connection unavailable');
  }

  const userExists = await blockchainService.checkUserExistsOnChain(user.wallet_address);
  let blockchainStatus = 'not_registered';
  let blockchainStatusString = 'not_registered';
  let txHash = null;
  let blockNumber = null;
  if (userExists) {
    const statusEnum = await blockchainService.getUserStatusFromChain(user.wallet_address);
    // Map enum to string
    switch (statusEnum?.toString()) {
      case '0': blockchainStatusString = 'pending'; break;
      case '1': blockchainStatusString = 'active'; break;
      case '2': blockchainStatusString = 'suspended'; break;
      case '3': blockchainStatusString = 'inactive'; break;
      default: blockchainStatusString = 'unknown';
    }
    blockchainStatus = blockchainStatusString;

    // Get latest UserRegistered event for this wallet
    const regEvents = await blockchainService.getPastEvents('UserRegistered', 0, 'latest');
    const regEvent = regEvents.success && regEvents.events
      ? regEvents.events.filter(e => e.userAddress?.toLowerCase() === user.wallet_address.toLowerCase()).pop()
      : null;
    if (regEvent) {
      txHash = regEvent.transactionHash;
      blockNumber = regEvent.blockNumber;
    }

    // Get latest UserStatusUpdated event for this wallet
    const statusEvents = await blockchainService.getPastEvents('UserStatusUpdated', 0, 'latest');
    const statusEvent = statusEvents.success && statusEvents.events
      ? statusEvents.events.filter(e => e.userAddress?.toLowerCase() === user.wallet_address.toLowerCase()).pop()
      : null;
    if (statusEvent && statusEvent.transactionHash && statusEvent.blockNumber) {
      // Prefer status update tx/block if more recent
      if (!blockNumber || statusEvent.blockNumber > blockNumber) {
        txHash = statusEvent.transactionHash;
        blockNumber = statusEvent.blockNumber;
      }
    }
  }
  return {
    wallet_address: user.wallet_address,
    blockchain_status: blockchainStatus,
    database_status: user.status,
    is_synced: userExists && blockchainStatus === user.status?.toLowerCase(),
    transaction_hash: txHash,
    block_number: blockNumber,
    message: userExists ? 
      `User found on blockchain with status: ${blockchainStatus}` :
      'User not registered on blockchain'
  };
};

// ===========================
// ADMIN PANEL SERVICES
// ===========================

// Search and filter audit logs
export async function searchAuditLogs(filters) {
  let where = [];
  let values = [];
  let idx = 1;
  
  // Filter by user name (partial match)
  if (filters.user) {
    where.push(`u.full_name ILIKE $${idx++}`);
    values.push(`%${filters.user}%`);
  }
  // Filter by user role
  if (filters.user_role) {
    where.push(`u.role = $${idx++}`);
    values.push(filters.user_role);
  }
  // Filter by action_type
  if (filters.action_type) {
    where.push(`a.action_type = $${idx++}`);
    values.push(filters.action_type);
  }
  // Filter by entity_type
  if (filters.entity_type) {
    where.push(`a.entity_type = $${idx++}`);
    values.push(filters.entity_type);
  }
  // Filter by date (YYYY-MM-DD)
  if (filters.date) {
    where.push(`DATE(a.timestamp) = $${idx++}`);
    values.push(filters.date);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const queryStr = `
    SELECT a.*, u.full_name AS user, u.role AS user_role
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.timestamp DESC
    LIMIT 100
  `;
  
  const { rows } = await query(queryStr, values);
  return rows;
}

// Helper: get primary key column for a table
async function getPrimaryKeyColumn(tableName) {
  const pkRes = await query(`
    SELECT a.attname AS column_name
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = $1::regclass AND i.indisprimary;
  `, [tableName]);
  return pkRes.rows[0]?.column_name || 'id';
}

// Add row to table
export async function addTableRow(tableName, rowData) {
  const columns = Object.keys(rowData);
  const values = Object.values(rowData);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const queryStr = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const { rows } = await query(queryStr, values);
  return rows[0];
}

// Update row in table (dynamic primary key)
export async function updateTableRow(tableName, id, rowData) {
  const pk = await getPrimaryKeyColumn(tableName);
  const columns = Object.keys(rowData);
  const values = Object.values(rowData);
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
  const queryStr = `UPDATE ${tableName} SET ${setClause} WHERE ${pk} = $${columns.length + 1} RETURNING *`;
  const { rows } = await query(queryStr, [...values, id]);
  return rows[0];
}

// Delete row from table (dynamic primary key)
export async function deleteTableRow(tableName, id) {
  const pk = await getPrimaryKeyColumn(tableName);
  const queryStr = `DELETE FROM ${tableName} WHERE ${pk} = $1 RETURNING *`;
  const { rows } = await query(queryStr, [id]);
  return rows[0];
}

// List all tables in the database
export async function listDatabaseTables() {
  const { rows } = await query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
  return rows.map(r => r.tablename);
}

// Get columns, rows, and primary key for a table (limit 50 rows)
export async function getTableData(tableName) {
  // Get columns
  const columnsRes = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [tableName]);
  const columns = columnsRes.rows.map(r => r.column_name);
  // Get rows
  const rowsRes = await query(`SELECT * FROM ${tableName} LIMIT 50`);
  // Get primary key
  const pk = await getPrimaryKeyColumn(tableName);
  return { columns, rows: rowsRes.rows, primaryKey: pk };
}

// Dashboard KPIs
export async function getDashboardKPIs() {
  // Total users by role
  const usersByRole = await query(`SELECT role, COUNT(*) as count FROM users WHERE is_deleted = false GROUP BY role`);
  // Total prescriptions
  const prescriptions = await query(`SELECT COUNT(*) FROM prescription WHERE is_deleted = false`);
  // Total shipments
  const shipments = await query(`SELECT COUNT(*) FROM shipment WHERE is_deleted = false`);
  // Total batches
  const batches = await query(`SELECT COUNT(*) FROM drugbatch WHERE is_deleted = false`);
  
  // Get blockchain health
  const blockchainHealth = await blockchainService.getBlockchainHealth();
  
  return {
    usersByRole: usersByRole.rows,
    totalPrescriptions: parseInt(prescriptions.rows[0].count, 10),
    totalShipments: parseInt(shipments.rows[0].count, 10),
    totalBatches: parseInt(batches.rows[0].count, 10),
    blockchainHealth: blockchainHealth
  };
}

// Reports
export async function getAllReports(queryParams) {
  // Filter by user type, region, or date
  let where = [];
  let values = [];
  let idx = 1;
  if (queryParams.userType) {
    where.push(`user_type = $${idx++}`);
    values.push(queryParams.userType);
  }
  if (queryParams.region) {
    where.push(`region = $${idx++}`);
    values.push(queryParams.region);
  }
  if (queryParams.date) {
    where.push(`DATE(created_at) = $${idx++}`);
    values.push(queryParams.date);
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const { rows } = await query(`SELECT * FROM reports ${whereClause} ORDER BY created_at DESC`, values);
  return rows;
}

// Analytics
export async function getSystemAnalytics() {
  // Total registered users by role
  const usersByRole = await query(`SELECT role, COUNT(*) as count FROM users WHERE is_deleted = false GROUP BY role`);
  // Active prescriptions
  const activePrescriptions = await query(`SELECT COUNT(*) FROM prescription WHERE status = 'issued' AND is_deleted = false`);
  // All prescriptions (for dispensed count)
  const prescriptionsRes = await query(`SELECT id, drug_id, status FROM prescription WHERE is_deleted = false`);
  // Total shipments
  const totalShipments = await query(`SELECT COUNT(*) FROM shipment WHERE is_deleted = false`);
  // Flagged shipments
  const flaggedShipments = await query(`SELECT COUNT(*) FROM shipment WHERE status = 'flagged' AND is_deleted = false`);
  // Failed shipments
  const failedShipments = await query(`SELECT COUNT(*) FROM shipment WHERE status = 'failed' AND is_deleted = false`);
  // Counterfeit drugs detected (use flagged shipments as proxy)
  const counterfeitDrugs = await query(`SELECT COUNT(*) FROM shipment WHERE status = 'flagged' AND is_deleted = false`);
  // Recent blockchain transactions
  const recentBlockchainTx = await query(`SELECT id, eventname, contractname, transactionhash, timestamp FROM blockchaineventlog ORDER BY timestamp DESC LIMIT 10`);
  // Drug distribution by region/facility
  const drugDistribution = await query(`SELECT f.location, d.name AS drug_name, SUM(i.available_quantity) AS total_quantity FROM inventory i JOIN drug d ON i.drug_id = d.id JOIN facility f ON i.facility_id = f.id WHERE i.available_quantity > 0 GROUP BY f.location, d.name ORDER BY total_quantity DESC`);
  // Prescription volume trend (daily for last 14 days)
  const prescriptionTrend = await query(`SELECT DATE(issue_date) AS day, COUNT(*) AS count FROM prescription WHERE is_deleted = false GROUP BY day ORDER BY day DESC LIMIT 14`);
  // Recent activity feed (latest actions by users, with role)
  const recentActivity = await query(`
    SELECT a.id, a.user_id, u.full_name AS user, u.role AS user_role, a.action_type, a.entity_type, a.entity_id, a.timestamp, a.details
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC LIMIT 10
  `);

  // Latest 10 logs from audit_log (for logs tab, join users for user and role)
  const latestLogsRes = await query(`
    SELECT a.*, u.full_name AS user, u.role AS user_role
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC LIMIT 10
  `);
  
  // Alerts panel: pending approvals, flagged drugs, failed shipments
  const pendingApprovals = await query(`SELECT br.id, br.pharmacist_id, br.distributor_id, br.batch_id, br.quantity_requested, br.request_date, br.status, br.is_deleted, br.shipment_id, br.drug_id FROM batch_request br WHERE br.status = 'pending' AND br.is_deleted = false ORDER BY br.request_date DESC LIMIT 5`);
  // Flagged drugs (from flagged shipments, join drug for name)
  const flaggedDrugs = await query(`SELECT s.id, s.shipmentnumber, s.drug_id, d.name AS drug_name, s.batch_id, s.quantity_shipped, s.departure_date FROM shipment s JOIN drug d ON s.drug_id = d.id WHERE s.status = 'flagged' AND s.is_deleted = false ORDER BY s.departure_date DESC LIMIT 5`);
  // Failed shipments (join drug for name)
  const failedShipmentsList = await query(`SELECT s.id, s.shipmentnumber, s.drug_id, d.name AS drug_name, s.quantity_shipped, s.departure_date FROM shipment s JOIN drug d ON s.drug_id = d.id WHERE s.status = 'failed' AND s.is_deleted = false ORDER BY s.departure_date DESC LIMIT 5`);
  
  return {
    stats: {
      usersByRole: usersByRole.rows,
      activePrescriptions: parseInt(activePrescriptions.rows[0].count, 10),
      totalShipments: parseInt(totalShipments.rows[0].count, 10),
      flaggedShipments: parseInt(flaggedShipments.rows[0].count, 10),
      failedShipments: parseInt(failedShipments.rows[0].count, 10),
      counterfeitDrugs: parseInt(counterfeitDrugs.rows[0].count, 10)
    },
    prescriptions: prescriptionsRes.rows,
    recentBlockchainTx: recentBlockchainTx.rows,
    drugDistribution: drugDistribution.rows,
    prescriptionTrend: prescriptionTrend.rows,
    recentActivity: recentActivity.rows,
    latestLogs: latestLogsRes.rows,
    alerts: {
      pendingApprovals: pendingApprovals.rows,
      flaggedDrugs: flaggedDrugs.rows,
      failedShipments: failedShipmentsList.rows
    }
  };
}

// Blockchain logs and system settings
export async function getBlockchainLogs() {
  // All blockchain event logs
  const { rows: logs } = await query(`SELECT * FROM blockchaineventlog ORDER BY timestamp DESC LIMIT 100`);
  // Use default settings object since system_settings table does not exist
  const settings = {
    systemStatus: "operational",
    maintenanceMode: false,
    notificationsEnabled: true,
    backupEnabled: true,
    databaseSize: "2.4 TB",
    lastBackup: "2 hours ago",
    activeUsers: 847
  };
  // Example node info (stub)
  const nodeInfo = { nodeUrl: "https://mainnet.infura.io/v3/your-key", synced: true, gasFee: "0.002 ETH" };
  return { logs, nodeInfo, settings };
}

// System settings update
export async function updateSystemSettings(settings) {
  // Update system settings in DB (stub: replace with real update logic)
  const keys = Object.keys(settings);
  if (keys.length === 0) return { success: false, message: "No settings provided" };
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map(k => settings[k]);
  await query(`UPDATE system_settings SET ${setClause}`, values);
  const { rows } = await query(`SELECT * FROM system_settings LIMIT 1`);
  return { success: true, updated: rows[0] || settings };
}

// ===========================
// SYSTEM SERVICES
// ===========================

// System health check
export const getSystemHealth = async () => {
  try {
    // Database health
    const dbResult = await query('SELECT 1 as healthy');
    const dbHealthy = dbResult.rows[0].healthy === 1;
    
    // Blockchain health
    const blockchainHealth = await blockchainService.getBlockchainHealth();
    
    // System metrics
    const userCount = await query('SELECT COUNT(*) FROM users WHERE is_deleted = false');
    const prescriptionCount = await query('SELECT COUNT(*) FROM prescription WHERE is_deleted = false');
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'healthy' : 'unhealthy',
      blockchain: blockchainHealth,
      metrics: {
        totalUsers: parseInt(userCount.rows[0].count),
        totalPrescriptions: parseInt(prescriptionCount.rows[0].count)
      }
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      database: 'unhealthy',
      blockchain: { connected: false, error: error.message },
      error: error.message
    };
  }
};

// ===========================
// HELPER FUNCTIONS
// ===========================

// Check if is_deleted column exists
const checkIsDeletedColumnExists = async () => {
  try {
    const { rows } = await query(`
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


// Add to SYSTEM SERVICES section in adminService.js
export const getSystemLogs = async (filters = {}) => {
  try {
    let where = [];
    let values = [];
    let idx = 1;

    // Filter by log level
    if (filters.level) {
      where.push(`level = $${idx++}`);
      values.push(filters.level);
    }
    
    // Filter by date range
    if (filters.startDate) {
      where.push(`timestamp >= $${idx++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      where.push(`timestamp <= $${idx++}`);
      values.push(filters.endDate);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const queryStr = `
      SELECT * FROM system_logs 
      ${whereClause}
      ORDER BY timestamp DESC 
      LIMIT 100
    `;

    const { rows } = await query(queryStr, values);
    return rows;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    throw error;
  }
};