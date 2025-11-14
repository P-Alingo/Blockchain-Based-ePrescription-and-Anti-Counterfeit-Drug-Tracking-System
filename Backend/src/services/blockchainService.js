// UserManagement contract: new user action functions
export async function deleteUserOnChain(walletAddress) {
  return await contract.deleteUser(walletAddress);
}

export async function editUserOnChain(walletAddress, metadata) {
  return await contract.editUser(walletAddress, metadata);
}

export async function syncUserOnChainAction(walletAddress) {
  return await contract.syncUser(walletAddress);
}

export async function viewUserOnChain(walletAddress) {
  return await contract.viewUser(walletAddress);
}
import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Load contract artifacts ----
const userManagementArtifactPath = path.resolve(
  __dirname,
  '../../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json'
);
const prescriptionManagementArtifactPath = path.resolve(
  __dirname,
  '../../../Smart Contracts/artifacts/contracts/PrescriptionManagement.sol/PrescriptionManagement.json'
);

if (!fs.existsSync(userManagementArtifactPath)) {
  console.error('❌ UserManagement contract JSON not found at:', userManagementArtifactPath);
  process.exit(1);
}
if (!fs.existsSync(prescriptionManagementArtifactPath)) {
  console.error('❌ PrescriptionManagement contract JSON not found at:', prescriptionManagementArtifactPath);
  process.exit(1);
}

const userManagementArtifact = JSON.parse(fs.readFileSync(userManagementArtifactPath, 'utf8'));
const prescriptionManagementArtifact = JSON.parse(fs.readFileSync(prescriptionManagementArtifactPath, 'utf8'));

// ---- Blockchain Setup ----
let provider, wallet, contract, prescriptionContract;

try {
  provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  contract = new ethers.Contract(
    process.env.USER_MANAGEMENT_ADDRESS,
    userManagementArtifact.abi,
    wallet
  );
  prescriptionContract = new ethers.Contract(
    process.env.PRESCRIPTION_MANAGEMENT_ADDRESS,
    prescriptionManagementArtifact.abi,
    wallet
  );
  console.log('✅ Blockchain service initialized');
  console.log('🔑 Admin wallet address:', wallet.address);
} catch (error) {
  console.error('❌ Blockchain setup failed:', error.message);
  process.exit(1);
}
// ===========================
// PRESCRIPTION MANAGEMENT CONTRACT FUNCTIONS
// Log prescription view on-chain
export async function viewPrescriptionOnChain(prescriptionId) {
  return await prescriptionContract.viewPrescription(prescriptionId);
}
// ===========================

// Create a prescription on-chain
export async function createPrescriptionOnChain(params) {
  return await prescriptionContract.createPrescription(
    params.databaseId,
    params.patient,
    params.prescriptionCode,
    params.drugId,
    params.drugName,
    params.strength,
    params.form,
    params.quantity,
    params.instructions,
    params.dosageAmount,
    params.dosageUnit,
    params.frequency,
    params.duration,
    params.validUntil
  );
}

// Dispense a prescription
export async function dispensePrescriptionOnChain(prescriptionId) {
  return await prescriptionContract.dispensePrescription(prescriptionId);
}

// Mark prescription as invalid
export async function markPrescriptionInvalidOnChain(prescriptionId, reason) {
  return await prescriptionContract.markPrescriptionInvalid(prescriptionId, reason);
}

// Delete a prescription
export async function deletePrescriptionOnChain(prescriptionId) {
  return await prescriptionContract.deletePrescription(prescriptionId);
}

// Update blockchain transaction hash
export async function updatePrescriptionBlockchainTxOnChain(prescriptionId, transactionHash) {
  return await prescriptionContract.updateBlockchainTx(prescriptionId, transactionHash);
}

// Get prescription details (view)
export async function getPrescriptionOnChain(prescriptionId) {
  return await prescriptionContract.getPrescription(prescriptionId);
}

// Get prescription by code (view)
export async function getPrescriptionByCodeOnChain(prescriptionCode) {
  return await prescriptionContract.getPrescriptionByCode(prescriptionCode);
}

// Get all prescriptions for a doctor
export async function getPrescriptionsByDoctorOnChain(doctorAddress) {
  return await prescriptionContract.getPrescriptionsByDoctor(doctorAddress);
}

// Get all prescriptions for a pharmacist
export async function getPrescriptionsByPharmacistOnChain(pharmacistAddress) {
  return await prescriptionContract.getPrescriptionsByPharmacist(pharmacistAddress);
}

// Get all prescriptions for a patient
export async function getPrescriptionsByPatientOnChain(patientAddress) {
  return await prescriptionContract.getPrescriptionsByPatient(patientAddress);
}

// Get all prescriptions (admin/regulator)
export async function getAllPrescriptionsOnChain() {
  return await prescriptionContract.getAllPrescriptions();
}

// Get flagged prescriptions (admin/regulator)
export async function getFlaggedPrescriptionsOnChain() {
  return await prescriptionContract.getFlaggedPrescriptions();
}

// Utility: Get prescription status as string
export async function getPrescriptionStatusOnChain(prescriptionId) {
  return await prescriptionContract.getPrescriptionStatus(prescriptionId);
}

// Utility: Check if valid for dispensing
export async function isValidForDispensingOnChain(prescriptionId) {
  return await prescriptionContract.isValidForDispensing(prescriptionId);
}

// Utility: Expire old prescriptions
export async function expireOldPrescriptionsOnChain() {
  return await prescriptionContract.expireOldPrescriptions();
}

// Export contract instance for direct access
export const getPrescriptionContract = () => prescriptionContract;

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
    return { success: true, transactionHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
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

    let tx, receipt;
    // Map statusEnum to contract function
    // 0: Pending, 1: Active, 2: Suspended, 3: Inactive
    switch (statusEnum) {
      case 1: // Active
        tx = await contract.approveUser(walletAddress, { gasLimit: 300000 });
        break;
      case 2: // Suspended
        tx = await contract.suspendUser(walletAddress, { gasLimit: 300000 });
        break;
      case 3: // Inactive
        tx = await contract.deactivateUser(walletAddress, { gasLimit: 300000 });
        break;
      case 4: // Reactivate (if you use 4 for reactivation)
        tx = await contract.reactivateUser(walletAddress, { gasLimit: 300000 });
        break;
      default:
        throw new Error(`Unsupported statusEnum: ${statusEnum}`);
    }
    receipt = await tx.wait();
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

    // Check if user is already registered on-chain
    const userExists = await checkUserExistsOnChain(user.wallet_address);
    let receipt, transactionHash, blockNumber;

    if (!userExists) {
      // Register user on-chain
      const tx = await contract.registerUser(user.wallet_address, roleId);
      receipt = await tx.wait();
      transactionHash = receipt.transactionHash;
      blockNumber = receipt.blockNumber;
      console.log(`✅ User ${user.full_name} registered on-chain`);
      console.log(`📌 Transaction hash: ${transactionHash}`);
      console.log(`📌 Block number: ${blockNumber}`);
    } else {
      console.log(`✅ User ${user.full_name} already registered on-chain, skipping registration.`);
    }

    // Update status on-chain (approve or change status)
    let statusTx, statusReceipt;
    try {
      // Use updateUserStatusOnChain for status changes
      const statusEnum = statusToEnum(user.status || 'active');
      // Only update status if not 'pending' (enum 0)
      if (statusEnum !== 0) {
        const statusResult = await updateUserStatusOnChain(user.wallet_address, statusEnum);
        console.log(`✅ User ${user.full_name} status updated on-chain (${user.status})`);
        if (statusResult && statusResult.blockNumber) {
          console.log(`📌 Status block number: ${statusResult.blockNumber}`);
        }
        statusReceipt = { transactionHash: statusResult.transactionHash, blockNumber: statusResult.blockNumber };
      } else {
        console.log(`ℹ️ Skipping status update to 'pending' for user ${user.wallet_address}`);
        statusReceipt = { transactionHash: null, blockNumber: null };
      }
    } catch (statusErr) {
      console.error(`❌ Failed to update user status on-chain:`, statusErr.message || statusErr);
      return { success: false, error: statusErr };
    }

    return {
      success: true,
      transactionHash: transactionHash || null,
      blockNumber: blockNumber || null,
      statusTxHash: statusReceipt.transactionHash,
      statusBlockNumber: statusReceipt.blockNumber
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
    case 'inactive': return 3;
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
      logEvents = true
    } = options;

    // User Registered Event
      contract.on('UserRegistered', async (userAddress, roleId, event) => {
        let transactionHash = event?.transactionHash;
        let blockNumber = event?.blockNumber;
        // Fallback: If event is missing, fetch from recent logs
        if (!transactionHash || !blockNumber) {
          try {
            // Get latest block and search for UserRegistered logs
            const filter = contract.filters.UserRegistered(userAddress);
            const logs = await contract.queryFilter(filter, 'latest');
            if (logs && logs.length > 0) {
              transactionHash = logs[0].transactionHash;
              blockNumber = logs[0].blockNumber;
            }
          } catch (err) {
            console.error('❌ Could not fetch event log for UserRegistered:', err);
          }
        }
        if (logEvents) {
          console.log(`🎯 New user registered: ${userAddress} with role ID: ${roleId}`);
          console.log(`📝 Transaction: ${transactionHash}`);
          console.log(`🕒 Block: ${blockNumber}`);
        }
        if (onUserRegistered) {
          onUserRegistered({
            userAddress,
            roleId: roleId.toString(),
            transactionHash,
            blockNumber,
            timestamp: new Date().toISOString()
          });
        }
        // Removed onUserStatusUpdated call from UserRegistered event listener
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
    // Import query from database config
    const { query } = await import('../config/database.js');
    // Prepare event log fields
    const eventname = eventType;
    const contractname = 'UserManagement';
    const entityid = data.userAddress || data.roleId || data.entityId || null;
    const entitytype = data.roleId ? 'user' : (data.entityType || null);
    const transactionhash = data.transactionHash || data.txHash || null;
    const timestamp = data.timestamp || new Date().toISOString();
    const details = JSON.stringify(data);
    // Insert into blockchaineventlog
    const sql = `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, timestamp, details, processed)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
    const params = [eventname, contractname, entityid, entitytype, transactionhash, timestamp, details, false];
    await query(sql, params);
    console.log(`💾 Blockchain event saved:`, { eventname, entityid, transactionhash, timestamp });
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