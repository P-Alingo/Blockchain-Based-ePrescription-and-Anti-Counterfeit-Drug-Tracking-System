import { query } from "../config/database.js";
import * as blockchainService from "./blockchainService.js";
import { ethers } from 'ethers';

// ===========================
// USER MANAGEMENT SERVICES
// ===========================

// Get all users (exclude deleted by default)
export const getAllUsers = async (includeDeleted = false) => {
  let sql = 'SELECT * FROM users';
  if (!includeDeleted) {
    sql += ' WHERE is_deleted = FALSE OR is_deleted IS NULL';
  }
  sql += ' ORDER BY createdat DESC';
  
  const { rows } = await query(sql);
  
  // Sanitize deleted user data
  const sanitizedUsers = rows.map(user => ({
    ...user,
    email: user.is_deleted ? '[DELETED]' : user.email,
    phone_number: user.is_deleted ? '[DELETED]' : user.phone_number,
    wallet_address: user.is_deleted ? '[DELETED]' : user.wallet_address
  }));
  
  return sanitizedUsers;
};

// Get single user by ID
export const getUserById = async (id) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (!rows.length) throw new Error('User not found');
  
  const user = rows[0];
  
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
  }
  
  return user;
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
  return rows;
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
  
  const values = fields.map(f => updates[f]);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
  const sql = `UPDATE users SET ${setClause}, updatedat=NOW() WHERE id=$${fields.length + 1} RETURNING *`;
  
  const { rows } = await query(sql, [...values, id]);
  if (!rows.length) throw new Error('User not found');

  const user = rows[0];
  
  // Sync to blockchain if wallet exists and role/status changed
  if (user.wallet_address && (updates.role || updates.status)) {
    try {
      await blockchainService.syncUserOnChain(user);
    } catch (error) {
      console.warn('Blockchain sync failed during update:', error.message);
      // Don't throw - database update succeeded
    }
  }
  
  return user;
};

// Delete user (soft delete)
export const deleteUser = async (id) => {
  const user = await getUserById(id);
  
  const hasIsDeletedColumn = await checkIsDeletedColumnExists();
  
  let result;
  if (hasIsDeletedColumn) {
    // Soft delete
    result = await query(
      'UPDATE users SET is_deleted = TRUE, status = $1, updatedat = NOW() WHERE id = $2 RETURNING *',
      ['suspended', id]
    );
  } else {
    // Hard delete
    result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  }

  if (!result.rows.length) throw new Error('User not found');

  const deletedUser = result.rows[0];
  
  // Update blockchain status to suspended if user has wallet
  if (user.wallet_address && !user.is_deleted) {
    try {
      const userExists = await blockchainService.checkUserExistsOnChain(user.wallet_address);
      if (userExists) {
        await blockchainService.updateUserStatusOnChain(user.wallet_address, 2); // suspended
      }
    } catch (blockchainError) {
      console.warn('Blockchain suspension failed:', blockchainError.message);
    }
  }

  return deletedUser;
};

// Restore soft-deleted user
export const restoreUser = async (id) => {
  const hasIsDeletedColumn = await checkIsDeletedColumnExists();
  
  if (!hasIsDeletedColumn) {
    throw new Error('Soft delete not enabled. is_deleted column does not exist.');
  }

  const { rows } = await query(
    'UPDATE users SET is_deleted = FALSE, status = $1, updatedat = NOW() WHERE id = $2 RETURNING *',
    ['active', id]
  );

  if (!rows.length) throw new Error('User not found');

  const user = rows[0];

  // Reactivate on blockchain if needed
  if (user.wallet_address) {
    try {
      const userExists = await blockchainService.checkUserExistsOnChain(user.wallet_address);
      if (userExists) {
        await blockchainService.updateUserStatusOnChain(user.wallet_address, 1); // active
      }
    } catch (blockchainError) {
      console.warn('Blockchain reactivation failed:', blockchainError.message);
    }
  }

  return user;
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

  // Verify contract connection before proceeding
  const isConnected = await blockchainService.verifyContractConnection();
  if (!isConnected) {
    throw new Error('Blockchain connection unavailable');
  }

    // Try blockchain sync first
    const syncResult = await blockchainService.syncUserOnChain(user);
    if (!syncResult.success) {
      // Do NOT update status, return error
      throw new Error('Blockchain sync failed: ' + (syncResult.error?.message || syncResult.error));
    }

    // Only update status to active if blockchain sync succeeded
    const { rows: updatedRows } = await query(
      'UPDATE users SET status=$1, updatedat=NOW() WHERE id=$2 RETURNING *',
      ['active', id]
    );
    const updatedUser = updatedRows[0];
    return updatedUser;
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
  const blockchainStatus = userExists ? await blockchainService.getUserStatusFromChain(user.wallet_address) : 'not_registered';

  return {
    wallet_address: user.wallet_address,
    blockchain_status: blockchainStatus,
    database_status: user.status,
    is_synced: userExists && blockchainStatus === user.status.toLowerCase(),
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