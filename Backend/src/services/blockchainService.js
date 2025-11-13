import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// ---- Blockchain Setup ----
let provider, wallet, contract;

try {
  provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  contract = new ethers.Contract(
    process.env.USER_MANAGEMENT_ADDRESS,
    userManagementArtifact.abi,
    wallet
  );
  console.log('✅ Blockchain service initialized');
  console.log('🔑 Admin wallet address:', wallet.address);
} catch (error) {
  console.error('❌ Blockchain setup failed:', error.message);
  process.exit(1);
}

// ===========================
// CORE BLOCKCHAIN FUNCTIONS
// ===========================

// Contract connection verification
export const verifyContractConnection = async () => {
  try {
    const roleCounter = await contract.roleCounter();
    console.log('✅ Contract connection verified. Role counter:', roleCounter.toString());
    return true;
  } catch (error) {
    console.error('❌ Contract connection failed:', error.message);
    return false;
  }
};

// 🔹 Get user by wallet address from blockchain (from userManagementService)
export const getUserOnChain = async (walletAddress) => {
  try {
    const role = await contract.getUserRole(walletAddress);
    const status = await contract.getUserStatus(walletAddress);
    return { 
      walletAddress, 
      role,
      status,
      exists: true
    };
  } catch (error) {
    if (error.reason === 'User does not exist') {
      return { 
        walletAddress, 
        exists: false 
      };
    }
    console.error("⚠️ Failed to fetch on-chain user:", error.message);
    throw new Error("Could not fetch user from blockchain");
  }
};

// Check if user exists on blockchain
export const checkUserExistsOnChain = async (walletAddress) => {
  try {
    const role = await contract.getUserRole(walletAddress);
    console.log(`✅ User ${walletAddress} exists on chain with role: ${role}`);
    return true;
  } catch (error) {
    if (error.reason === 'User does not exist') {
      console.log(`❌ User ${walletAddress} does not exist on blockchain`);
      return false;
    }
    console.error(`⚠️ Error checking user existence: ${error.message}`);
    throw error;
  }
};

// Get user status from blockchain
export const getUserStatusFromChain = async (walletAddress) => {
  try {
    const status = await contract.getUserStatus(walletAddress);
    console.log(`📊 On-chain status for ${walletAddress}: ${status}`);
    return status;
  } catch (error) {
    console.error(`❌ Cannot get user status from chain: ${error.message}`);
    return null;
  }
};

// Get user role from blockchain
export const getUserRole = async (walletAddress) => {
  try {
    const role = await contract.getUserRole(walletAddress);
    console.log(`✅ Fetched blockchain role for ${walletAddress}: ${role}`);
    return role;
  } catch (error) {
    console.error(`❌ Failed to fetch on-chain user role: ${error.message}`);
    throw new Error("Could not fetch user from blockchain");
  }
};

// ===========================
// ROLE MANAGEMENT FUNCTIONS
// ===========================

// Get or create roleId on-chain
export const getOrCreateRoleId = async (roleName) => {
  try {
    const isConnected = await verifyContractConnection();
    if (!isConnected) {
      throw new Error('Contract connection unavailable');
    }

    const totalRoles = await contract.roleCounter();
    let roleId = 0;

    // Search for existing role
    for (let i = 1; i <= totalRoles; i++) {
      try {
        const name = await contract.getRoleName(i);
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
      const tx = await contract.createRole(roleName.toLowerCase(), {
        gasLimit: 300000
      });
      const receipt = await tx.wait();
      console.log(`✅ Role created in block ${receipt.blockNumber}`);
      
      roleId = await contract.roleCounter();
    }

    console.log(`✅ Using role ID ${roleId} for ${roleName}`);
    return roleId;
  } catch (error) {
    console.error('❌ getOrCreateRoleId failed:', error);
    throw error;
  }
};

// Create new role on blockchain
export const createRoleOnChain = async (roleName) => {
  try {
    console.log(`📝 Creating new role: ${roleName}`);
    
    const tx = await contract.createRole(roleName.toLowerCase(), {
      gasLimit: 300000
    });
    const receipt = await tx.wait();
    console.log(`✅ Role created in block ${receipt.blockNumber}`);
    
    const roleId = await contract.roleCounter();
    return roleId;
  } catch (error) {
    console.error('❌ Role creation failed:', error);
    throw error;
  }
};

// ===========================
// USER MANAGEMENT FUNCTIONS
// ===========================

// 🔹 Add user to blockchain (from userManagementService)
export const addUserToBlockchain = async (walletAddress, role) => {
  try {
    console.log(`📝 Adding user ${walletAddress} with role ${role} to blockchain`);
    
    const roleId = await getOrCreateRoleId(role);
    const tx = await contract.registerUser(walletAddress, roleId, {
      gasLimit: 500000
    });
    const receipt = await tx.wait();
    console.log(`✅ User added to blockchain in block ${receipt.blockNumber}`);
    return { success: true, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error(`❌ Blockchain user addition failed for ${walletAddress}:`, error.message);
    
    if (error.reason === 'User already registered') {
      console.log(`✅ User was already registered (race condition)`);
      return { success: true, alreadyExists: true };
    }
    
    throw error;
  }
};

// Register user on blockchain (alias for addUserToBlockchain)
export const registerUserOnChain = async (walletAddress, roleId) => {
  try {
    console.log(`📝 Registering user ${walletAddress} with role ID ${roleId}`);
    
    // Check if user already exists
    const userExists = await checkUserExistsOnChain(walletAddress);
    if (userExists) {
      console.log(`✅ User ${walletAddress} already registered`);
      return { success: true, alreadyExists: true };
    }

    // Register new user
    const tx = await contract.registerUser(walletAddress, roleId, {
      gasLimit: 500000
    });
    const receipt = await tx.wait();
    console.log(`✅ User registered in block ${receipt.blockNumber}`);
    return { success: true, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error(`❌ User registration failed for ${walletAddress}:`, error.message);
    
    if (error.reason === 'User already registered') {
      console.log(`✅ User was already registered (race condition)`);
      return { success: true, alreadyExists: true };
    }
    
    throw error;
  }
};

// 🔹 Update user role on blockchain (from userManagementService)
export const updateUserRoleOnChain = async (walletAddress, newRole) => {
  try {
    console.log(`🔄 Updating role for ${walletAddress} to ${newRole}`);
    
    // Verify user exists before updating
    const userExists = await checkUserExistsOnChain(walletAddress);
    if (!userExists) {
      throw new Error(`Cannot update role: User ${walletAddress} not registered on blockchain`);
    }

    const roleId = await getOrCreateRoleId(newRole);
    const tx = await contract.updateUserRole(walletAddress, roleId, {
      gasLimit: 300000
    });
    const receipt = await tx.wait();
    console.log(`✅ Role updated in block ${receipt.blockNumber}`);
    return { success: true, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error(`❌ Role update failed for ${walletAddress}:`, error.message);
    throw error;
  }
};

// Update user status on blockchain
export const updateUserStatusOnChain = async (walletAddress, statusEnum) => {
  try {
    console.log(`🔄 Updating status for ${walletAddress} to ${statusEnum}`);
    
    // Verify user exists before updating status
    const userExists = await checkUserExistsOnChain(walletAddress);
    if (!userExists) {
      throw new Error(`Cannot update status: User ${walletAddress} not registered on blockchain`);
    }

    const tx = await contract.updateUserStatus(walletAddress, statusEnum, {
      gasLimit: 300000
    });
    const receipt = await tx.wait();
    console.log(`✅ Status updated in block ${receipt.blockNumber}`);
    return { success: true, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error(`❌ Status update failed for ${walletAddress}:`, error.message);
    throw error;
  }
};

// 🔹 Remove user from blockchain (from userManagementService)
export const removeUserFromBlockchain = async (walletAddress) => {
  try {
    console.log(`🗑️ Removing user ${walletAddress} from blockchain`);
    
    const tx = await contract.removeUser(walletAddress, {
      gasLimit: 300000
    });
    const receipt = await tx.wait();
    console.log(`✅ User removed from blockchain in block ${receipt.blockNumber}`);
    return { success: true, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error(`❌ Blockchain user removal failed for ${walletAddress}:`, error.message);
    throw error;
  }
};

// ===========================
// COMPREHENSIVE SYNC FUNCTIONS
// ===========================

/// Enhanced sync user on blockchain
export async function syncUserOnChain(user) {
  try {
    console.log(`🔄 Starting blockchain sync for user: ${user.full_name} (${user.wallet_address})`);

    // Ensure contract is connected
    if (!contract) throw new Error("UserManagement contract not connected");

    // Get role ID
    const roleId = await getOrCreateRoleId(user.role);
    console.log(`✅ Using role ID ${roleId} for ${user.role}`);

    // Send transaction
    const tx = await contract.registerUser(user.wallet_address, roleId);

    // Wait for mining and get receipt
    const receipt = await tx.wait();

    console.log(`✅ User ${user.full_name} registered on-chain`);
    console.log(`📌 Transaction hash: ${receipt.transactionHash}`);
    console.log(`📌 Block number: ${receipt.blockNumber}`);

    // You can optionally update your DB here with receipt.transactionHash & receipt.blockNumber

    return { 
      success: true, 
      transactionHash: receipt.transactionHash, 
      blockNumber: receipt.blockNumber 
    };
  } catch (err) {
    console.error("❌ syncUserOnChain failed:", err.message || err);
    return { success: false, error: err };
  }
};


// ===========================
// UTILITY FUNCTIONS
// ===========================

// Convert DB status string to Solidity enum index
export const statusToEnum = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return 0;
    case 'active': return 1;
    case 'suspended': return 2;
    default: throw new Error('Invalid status string');
  }
};

// Get blockchain health status
export const getBlockchainHealth = async () => {
  try {
    const isConnected = await verifyContractConnection();
    const network = await provider.getNetwork();
    const balance = await wallet.getBalance();
    const gasPrice = await provider.getGasPrice();
    
    return {
      connected: isConnected,
      network: network.name,
      chainId: network.chainId,
      adminAddress: wallet.address,
      adminBalance: ethers.utils.formatEther(balance),
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
      contractAddress: process.env.USER_MANAGEMENT_ADDRESS,
      blockNumber: await provider.getBlockNumber()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

// Get contract instance for direct access
export const getContract = () => {
  return contract;
};

// Get provider for direct access
export const getProvider = () => {
  return provider;
};

// Get wallet for direct access
export const getWallet = () => {
  return wallet;
};

// ===========================
// EVENT LISTENERS
// ===========================

// Listen for user registered events
export const listenForUserEvents = (options = {}) => {
  try {
    const {
      onUserRegistered = null,
      onUserStatusUpdated = null,
      onRoleCreated = null,
      onUserRemoved = null,
      logEvents = true
    } = options;

    // User Registered Event
    contract.on('UserRegistered', (userAddress, roleId, event) => {
      if (logEvents) {
        console.log(`🎯 New user registered: ${userAddress} with role ID: ${roleId}`);
        console.log(`📝 Transaction: ${event.transactionHash}`);
        console.log(`🕒 Block: ${event.blockNumber}`);
      }
      
      if (onUserRegistered) {
        onUserRegistered({
          userAddress,
          roleId: roleId.toString(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date().toISOString()
        });
      }
    });

    // User Status Updated Event
    contract.on('UserStatusUpdated', (userAddress, newStatus, event) => {
      const statusMap = { '0': 'pending', '1': 'active', '2': 'suspended' };
      const statusName = statusMap[newStatus.toString()] || 'unknown';
      
      if (logEvents) {
        console.log(`🔄 User status updated: ${userAddress} to status: ${statusName} (${newStatus})`);
        console.log(`📝 Transaction: ${event.transactionHash}`);
        console.log(`🕒 Block: ${event.blockNumber}`);
      }
      
      if (onUserStatusUpdated) {
        onUserStatusUpdated({
          userAddress,
          newStatus: newStatus.toString(),
          statusName,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Role Created Event
    contract.on('RoleCreated', (roleId, roleName, event) => {
      if (logEvents) {
        console.log(`🏷️ New role created: ${roleName} (ID: ${roleId})`);
        console.log(`📝 Transaction: ${event.transactionHash}`);
        console.log(`🕒 Block: ${event.blockNumber}`);
      }
      
      if (onRoleCreated) {
        onRoleCreated({
          roleId: roleId.toString(),
          roleName,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date().toISOString()
        });
      }
    });

    // User Removed Event
    contract.on('UserRemoved', (userAddress, event) => {
      if (logEvents) {
        console.log(`🗑️ User removed from blockchain: ${userAddress}`);
        console.log(`📝 Transaction: ${event.transactionHash}`);
        console.log(`🕒 Block: ${event.blockNumber}`);
      }
      
      if (onUserRemoved) {
        onUserRemoved({
          userAddress,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log('✅ Blockchain event listeners activated');
    
    return {
      success: true,
      message: 'Event listeners activated',
      events: ['UserRegistered', 'UserStatusUpdated', 'RoleCreated', 'UserRemoved']
    };
  } catch (error) {
    console.error('❌ Failed to setup event listeners:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get current event listener status
export const getEventListenerStatus = () => {
  try {
    const listenerCount = {
      UserRegistered: contract.listenerCount('UserRegistered'),
      UserStatusUpdated: contract.listenerCount('UserStatusUpdated'),
      RoleCreated: contract.listenerCount('RoleCreated'),
      UserRemoved: contract.listenerCount('UserRemoved')
    };
    
    return {
      active: true,
      listeners: listenerCount,
      contractAddress: contract.address,
      network: provider.network?.name || 'unknown'
    };
  } catch (error) {
    return {
      active: false,
      error: error.message
    };
  }
};

// Remove event listeners
export const removeEventListeners = (eventName = null) => {
  try {
    if (eventName) {
      // Remove specific event listener
      contract.removeAllListeners(eventName);
      console.log(`✅ Removed listeners for event: ${eventName}`);
    } else {
      // Remove all listeners
      contract.removeAllListeners('UserRegistered');
      contract.removeAllListeners('UserStatusUpdated');
      contract.removeAllListeners('RoleCreated');
      contract.removeAllListeners('UserRemoved');
      console.log('✅ All blockchain event listeners removed');
    }
    
    return {
      success: true,
      message: eventName ? `Listeners for ${eventName} removed` : 'All listeners removed'
    };
  } catch (error) {
    console.error('❌ Failed to remove event listeners:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Initialize event listeners with custom handlers
export const initializeEventListeners = (options = {}) => {
  const {
    enableLogging = true,
    saveToDatabase = false,
    webhookUrl = null,
    onEvent = null
  } = options;

  const eventHandlers = {
    onUserRegistered: async (data) => {
      if (saveToDatabase) {
        await saveEventToDatabase('UserRegistered', data);
      }
      
      if (webhookUrl) {
        await sendWebhook(webhookUrl, 'UserRegistered', data);
      }
      
      if (onEvent) {
        onEvent('UserRegistered', data);
      }
    },
    
    onUserStatusUpdated: async (data) => {
      if (saveToDatabase) {
        await saveEventToDatabase('UserStatusUpdated', data);
      }
      
      if (webhookUrl) {
        await sendWebhook(webhookUrl, 'UserStatusUpdated', data);
      }
      
      if (onEvent) {
        onEvent('UserStatusUpdated', data);
      }
    },
    
    onRoleCreated: async (data) => {
      if (saveToDatabase) {
        await saveEventToDatabase('RoleCreated', data);
      }
      
      if (webhookUrl) {
        await sendWebhook(webhookUrl, 'RoleCreated', data);
      }
      
      if (onEvent) {
        onEvent('RoleCreated', data);
      }
    },
    
    onUserRemoved: async (data) => {
      if (saveToDatabase) {
        await saveEventToDatabase('UserRemoved', data);
      }
      
      if (webhookUrl) {
        await sendWebhook(webhookUrl, 'UserRemoved', data);
      }
      
      if (onEvent) {
        onEvent('UserRemoved', data);
      }
    }
  };

  return listenForUserEvents({
    ...eventHandlers,
    logEvents: enableLogging
  });
};

// Helper function to save events to database
const saveEventToDatabase = async (eventType, data) => {
  try {
    // This would integrate with your database
    // For now, just log it
    console.log(`💾 Saving ${eventType} event to database:`, data);
    
    // Example database integration:
    // await query(
    //   'INSERT INTO blockchain_events (event_type, user_address, details, transaction_hash, block_number) VALUES ($1, $2, $3, $4, $5)',
    //   [eventType, data.userAddress, JSON.stringify(data), data.transactionHash, data.blockNumber]
    // );
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to save event to database:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send webhook notifications
const sendWebhook = async (url, eventType, data) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventType,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
    
    console.log(`🌐 Webhook sent for ${eventType} event`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send webhook:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced getPastEvents function
export const getPastEvents = async (eventName, fromBlock = 0, toBlock = 'latest') => {
  try {
    // Validate event name
    const validEvents = ['UserRegistered', 'UserStatusUpdated', 'RoleCreated', 'UserRemoved'];
    if (!validEvents.includes(eventName)) {
      return {
        success: false,
        error: `Invalid event name. Must be one of: ${validEvents.join(', ')}`
      };
    }

    const events = await contract.queryFilter(
      contract.filters[eventName](),
      parseInt(fromBlock),
      toBlock === 'latest' ? 'latest' : parseInt(toBlock)
    );
    
    return {
      success: true,
      eventName,
      count: events.length,
      events: events.map(event => ({
        event: eventName,
        userAddress: event.args[0],
        ...(eventName === 'UserRegistered' && { roleId: event.args[1]?.toString() }),
        ...(eventName === 'UserStatusUpdated' && { newStatus: event.args[1]?.toString() }),
        ...(eventName === 'RoleCreated' && { 
          roleId: event.args[0]?.toString(),
          roleName: event.args[1]
        }),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        logIndex: event.logIndex,
        timestamp: new Date().toISOString()
      }))
    };
  } catch (error) {
    console.error(`❌ Failed to get past events for ${eventName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Initialize event listeners on service start (Uncomment to enable)
const initializeBlockchainService = () => {
  console.log('🚀 Initializing Blockchain Service...');
  
  // Check if we should enable event listeners
  const enableEventListeners = process.env.ENABLE_BLOCKCHAIN_EVENTS === 'true';
  
  if (enableEventListeners) {
    console.log('🔔 Enabling blockchain event listeners...');
    
    initializeEventListeners({
      enableLogging: true,
      saveToDatabase: process.env.SAVE_EVENTS_TO_DB === 'true',
      webhookUrl: process.env.BLOCKCHAIN_WEBHOOK_URL || null,
      onEvent: (eventType, data) => {
        // Custom event handler for business logic
        console.log(`📢 Custom handler for ${eventType}:`, data);
        
        // Example: Update user status in database when blockchain status changes
        if (eventType === 'UserStatusUpdated') {
          // This would update your database to match blockchain state
          // updateUserStatusInDatabase(data.userAddress, data.statusName);
        }
      }
    });
  } else {
    console.log('🔕 Blockchain event listeners disabled (set ENABLE_BLOCKCHAIN_EVENTS=true to enable)');
  }
  
  // Verify connection on startup
  verifyContractConnection().then(result => {
    if (result) {
      console.log('🎉 Blockchain service ready and connected');
    } else {
      console.log('⚠️ Blockchain service started but contract connection failed');
    }
  });
};

// Auto-initialize when this module is imported
initializeBlockchainService();