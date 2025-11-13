import * as adminService from "../services/adminService.js";
import * as blockchainService from "../services/blockchainService.js";

// ===========================
// USER MANAGEMENT CONTROLLERS
// ===========================
// Approve user (admin action: pending -> active)
export const approveUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await adminService.approveUser(userId);
    res.json({ success: true, ...result, message: "User approved and status updated on-chain" });
  } catch (error) {
    console.error('❌ approveUser error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users (exclude deleted by default)
export const getAllUsers = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const users = await adminService.getAllUsers(includeDeleted);
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Get single user
export const getUserById = async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ getUserById error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  const term = req.query.query;
  if (!term) return res.status(400).json({ success: false, message: 'Query is required' });

  try {
    const users = await adminService.searchUsers(term);
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ searchUsers error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

// Add new user
export const addUser = async (req, res) => {
  const { full_name, email, role, wallet_address } = req.body;
  if (!full_name || !email || !role || !wallet_address) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const user = await adminService.createUser({ full_name, email, role, wallet_address });
    res.json({ success: true, user, message: 'User added successfully' });
  } catch (error) {
    console.error('❌ addUser error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'User with this email or wallet already exists' });
    }
    
    res.status(500).json({ success: false, message: 'Failed to add user' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  
  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  try {
    const user = await adminService.updateUser(userId, updates);
    res.json({ success: true, user, message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ updateUser error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// Manual blockchain sync
export const syncUserToBlockchain = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await adminService.syncUserToBlockchain(userId);
    res.json({ 
      success: true, 
      user, 
      message: 'User successfully synced to blockchain' 
    });
  } catch (error) {
    console.error('❌ syncUserToBlockchain error:', error);
    
    let errorMessage = 'Failed to sync user to blockchain';
    let solution = 'Please check the user has a valid wallet address';
    
    if (error.message.includes('User has no wallet address')) {
      errorMessage = 'User has no wallet address';
      solution = 'Add a wallet address to the user profile';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for blockchain transaction';
      solution = 'Add more ETH to the admin wallet for gas fees';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      detail: error.message,
      solution: solution
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await adminService.deleteUser(userId);
    
    const response = {
      success: true, 
      message: 'User deleted successfully',
      user
    };

    res.json(response);
  } catch (error) {
    console.error('❌ deleteUser error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// Restore soft-deleted user
export const restoreUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await adminService.restoreUser(userId);
    res.json({ 
      success: true, 
      message: 'User restored successfully',
      user
    });
  } catch (error) {
    console.error('❌ restoreUser error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get deleted users
export const getDeletedUsers = async (req, res) => {
  try {
    const users = await adminService.getDeletedUsers();
    res.json({ 
      success: true, 
      users,
      message: `Found ${users.length} deleted users`
    });
  } catch (error) {
    console.error('❌ getDeletedUsers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's blockchain status
export const getUserBlockchainStatus = async (req, res) => {
  const userId = req.params.id;

  try {
    const status = await adminService.getUserBlockchainStatus(userId);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('❌ getUserBlockchainStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// ADMIN PANEL CONTROLLERS
// ===========================

// Add row to table
export async function addTableRow(req, res, next) {
  try {
    const { table } = req.params;
    const rowData = req.body;
    if (!table || !rowData) return res.status(400).json({ error: 'Table name and row data required' });
    const result = await adminService.addTableRow(table, rowData);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Update row in table (dynamic primary key)
export async function updateTableRow(req, res, next) {
  try {
    const { table, id } = req.params;
    const rowData = req.body;
    if (!table || !id || !rowData) return res.status(400).json({ error: 'Table name, id, and row data required' });
    const result = await adminService.updateTableRow(table, id, rowData);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Delete row from table (dynamic primary key)
export async function deleteTableRow(req, res, next) {
  try {
    const { table, id } = req.params;
    if (!table || !id) return res.status(400).json({ error: 'Table name and id required' });
    const result = await adminService.deleteTableRow(table, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// List all tables
export async function listTables(req, res, next) {
  try {
    const tables = await adminService.listDatabaseTables();
    res.json({ tables });
  } catch (error) {
    next(error);
  }
}

// Get table data (include primary key)
export async function getTableData(req, res, next) {
  try {
    const { table } = req.params;
    if (!table) return res.status(400).json({ error: 'Table name required' });
    const data = await adminService.getTableData(table);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Search and filter audit logs
export async function searchAuditLogs(req, res, next) {
  try {
    const filters = req.query;
    const logs = await adminService.searchAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

// Dashboard KPIs
export async function getDashboard(req, res, next) {
  try {
    const dashboard = await adminService.getDashboardKPIs();
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

// Reports
export async function getReports(req, res, next) {
  try {
    const reports = await adminService.getAllReports(req.query);
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

// Analytics
export async function getAnalytics(req, res, next) {
  try {
    const analytics = await adminService.getSystemAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

// Blockchain logs
export async function getBlockchainLogs(req, res, next) {
  try {
    const logs = await adminService.getBlockchainLogs();
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

// System settings update
export async function updateSettings(req, res, next) {
  try {
    const result = await adminService.updateSystemSettings(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ===========================
// BLOCKCHAIN EVENT CONTROLLERS
// ===========================

// Get event listener status
export const getEventListenerStatus = async (req, res) => {
  try {
    const status = await blockchainService.getEventListenerStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('❌ getEventListenerStatus error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Start event listeners
export const startEventListeners = async (req, res) => {
  try {
    const result = await blockchainService.initializeEventListeners(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ startEventListeners error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Stop event listeners
export const stopEventListeners = async (req, res) => {
  try {
    const { eventName } = req.query; // Get eventName from query params
    const result = await blockchainService.removeEventListeners(eventName);
    res.json(result);
  } catch (error) {
    console.error('❌ stopEventListeners error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get past events
export const getPastEvents = async (req, res) => {
  try {
    const { eventName, fromBlock = 0, toBlock = 'latest' } = req.query;
    
    if (!eventName) {
      return res.status(400).json({ 
        success: false, 
        error: 'eventName query parameter is required' 
      });
    }

    const result = await blockchainService.getPastEvents(eventName, fromBlock, toBlock);
    res.json(result);
  } catch (error) {
    console.error('❌ getPastEvents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===========================
// SYSTEM CONTROLLERS
// ===========================

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    const health = await adminService.getSystemHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// Blockchain health check
export const blockchainHealth = async (req, res) => {
  try {
    const blockchainHealth = await blockchainService.getBlockchainHealth();
    res.json({
      success: true,
      blockchain: blockchainHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Blockchain health check failed',
      error: error.message
    });
  }
};