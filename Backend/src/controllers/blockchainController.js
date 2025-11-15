// Centralized Blockchain Controller
import { 
  getBlockchainHealth, 
  getBlockchainEvents, 
  getBlockchainStats, 
  getBlockchainEntityEvents, 
  getBlockchainEntityStatus, 
  getEventListenerStatus, 
  initializeEventListeners, 
  removeEventListeners, 
  getPastEvents, 
  syncUserToBlockchain, 
  getUserBlockchainStatus 
} from "../services/blockchainService.js";
import { query } from "../config/database.js";  // MOVED TO TOP

// Health endpoint
export async function blockchainHealth(req, res) {
  try {
    const health = await getBlockchainHealth();
    res.json({ blockchain: health });
  } catch (error) {
    res.status(500).json({ blockchain: { connected: false } });
  }
}  // ADDED MISSING CLOSING BRACE

// All blockchain events
export async function blockchainEvents(req, res) {
  try {
    const events = await getBlockchainEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json([]);
  }
}

// Blockchain stats (users, prescriptions, batches, flagged, etc.)
export async function blockchainStats(req, res) {
  try {
    const stats = await getBlockchainStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({});
  }
}

// Events for a specific entity (user, prescription, batch, shipment)
export async function blockchainEntityEvents(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const events = await getBlockchainEntityEvents(entityType, entityId);
    res.json(events);
  } catch (error) {
    res.status(500).json([]);
  }
}

// Status for a specific entity
export async function blockchainEntityStatus(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const status = await getBlockchainEntityStatus(entityType, entityId);
    res.json(status);
  } catch (error) {
    res.status(500).json({});
  }
}  // ADDED MISSING CLOSING BRACE

// User edit endpoint with event logging
export async function blockchainEditUser(req, res) {
  try {
    const userId = req.params.id;
    const updatedFields = req.body;
    
    // Fetch original user
    const userResult = await query("SELECT * FROM users WHERE id = $1", [userId]);
    if (userResult.rowCount === 0) return res.status(404).json({ success: false, message: "User not found" });
    
    const originalUser = userResult.rows[0];
    
    // Update user in DB
    const updateFields = [];
    const updateValues = [];
    let idx = 2;
    
    for (const key in updatedFields) {
      updateFields.push(`${key} = $${idx}`);
      updateValues.push(updatedFields[key]);
      idx++;
    }
    
    if (updateFields.length === 0) return res.status(400).json({ success: false, message: "No fields to update" });
    
    await query(`UPDATE users SET ${updateFields.join(", ")} WHERE id = $1`, [userId, ...updateValues]);
    
    // Log event type
    let eventType = "user_edit";
    if (updatedFields.role && updatedFields.role !== originalUser.role) {
      eventType = "role_update";
    }
    
    // Save event to blockchaineventlog
    // Note: You'll need to implement saveEventToDatabase or use an existing function
    // await saveEventToDatabase(eventType, {
    //   userId,
    //   updatedFields,
    //   previousRole: originalUser.role,
    //   newRole: updatedFields.role || originalUser.role
    // });
    
    res.json({ success: true, message: "User updated", eventType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Event listener status
export async function blockchainEventListenerStatus(req, res) {
  try {
    const status = await getEventListenerStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Start event listeners
export async function blockchainStartEventListeners(req, res) {
  try {
    const result = await initializeEventListeners(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Stop event listeners
export async function blockchainStopEventListeners(req, res) {
  try {
    const { eventName } = req.query;
    const result = await removeEventListeners(eventName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get past events
export async function blockchainPastEvents(req, res) {
  try {
    const { eventName, fromBlock = 0, toBlock = 'latest' } = req.query;
    if (!eventName) {
      return res.status(400).json({ success: false, error: 'eventName query parameter is required' });
    }
    const result = await getPastEvents(eventName, fromBlock, toBlock);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Manual blockchain sync for user
export async function blockchainSyncUser(req, res) {
  try {
    const userId = req.params.id;
    const user = await syncUserToBlockchain(userId);
    res.json({ success: true, user, message: 'User successfully synced to blockchain' });
  } catch (error) {
    let errorMessage = 'Failed to sync user to blockchain';
    let solution = 'Please check the user has a valid wallet address';
    if (error.message.includes('User has no wallet address')) {
      errorMessage = 'User has no wallet address';
      solution = 'Add a wallet address to the user profile';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for blockchain transaction';
      solution = 'Add more ETH to the admin wallet for gas fees';
    }
    res.status(500).json({ success: false, message: errorMessage, detail: error.message, solution });
  }
}

// Get user's blockchain status
export async function blockchainUserStatus(req, res) {
  try {
    const userId = req.params.id;
    const status = await getUserBlockchainStatus(userId);
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Doctor: Blockchain health endpoint
export async function doctorBlockchainHealth(req, res) {
  try {
    const health = await getBlockchainHealth();
    res.json({ blockchain: health });
  } catch (error) {
    res.status(500).json({ blockchain: { connected: false } });
  }
}

// Doctor: Blockchain events for prescriptions
export async function doctorBlockchainEvents(req, res) {
  try {
    const userId = req.user.id;
    // Get doctorId from users table
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) return res.status(404).json([]);
    const doctorId = doctorResult.rows[0].id;
    // Get prescription IDs for this doctor
    const prescResult = await query("SELECT id FROM prescription WHERE doctor_id = $1", [doctorId]);
    const prescriptionIds = prescResult.rows.map(row => row.id);
    if (prescriptionIds.length === 0) return res.json([]);
    // Get blockchain events for these prescriptions
    const eventsResult = await query(
      `SELECT * FROM blockchaineventlog WHERE entitytype = 'prescription' AND entityid = ANY($1::int[]) ORDER BY timestamp DESC`,
      [prescriptionIds]
    );
    res.json(eventsResult.rows);
  } catch (error) {
    res.status(500).json([]);
  }
}

// Pharmacist: Blockchain events for prescriptions
export async function pharmacistBlockchainEvents(req, res) {
  try {
    const userId = req.user.id;
    // Get pharmacistId from users table
    const pharmacistResult = await query("SELECT id FROM pharmacist WHERE userid = $1", [userId]);
    if (pharmacistResult.rowCount === 0) return res.status(404).json([]);
    const pharmacistId = pharmacistResult.rows[0].id;
    // Get prescription IDs dispensed by this pharmacist
    const prescResult = await query("SELECT id FROM prescription WHERE pharmacist_id = $1", [pharmacistId]);
    const prescriptionIds = prescResult.rows.map(row => row.id);
    if (prescriptionIds.length === 0) return res.json([]);
    // Get blockchain events for these prescriptions
    const eventsResult = await query(
      `SELECT * FROM blockchaineventlog WHERE entitytype = 'prescription' AND entityid = ANY($1::int[]) ORDER BY timestamp DESC`,
      [prescriptionIds]
    );
    res.json(eventsResult.rows);
  } catch (error) {
    res.status(500).json([]);
  }
}

// Manufacturer: Blockchain events for batches
export async function manufacturerBlockchainEvents(req, res) {
  try {
    const userId = req.user.id;
    // Get manufacturerId from users table
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) return res.status(404).json([]);
    const manufacturerId = manufacturerResult.rows[0].id;
    // Get batch IDs created by this manufacturer
    const batchResult = await query("SELECT id FROM drugbatch WHERE manufacturer_id = $1", [manufacturerId]);
    const batchIds = batchResult.rows.map(row => row.id);
    if (batchIds.length === 0) return res.json([]);
    // Get blockchain events for these batches
    const eventsResult = await query(
      `SELECT * FROM blockchaineventlog WHERE entitytype = 'batch' AND entityid = ANY($1::int[]) ORDER BY timestamp DESC`,
      [batchIds]
    );
    res.json(eventsResult.rows);
  } catch (error) {
    res.status(500).json([]);
  }
}

// Distributor: Blockchain events for shipments
export async function distributorBlockchainEvents(req, res) {
  try {
    const userId = req.user.id;
    // Get distributorId from users table
    const distributorResult = await query("SELECT id FROM distributor WHERE userid = $1", [userId]);
    if (distributorResult.rowCount === 0) return res.status(404).json([]);
    const distributorId = distributorResult.rows[0].id;
    // Get shipment IDs handled by this distributor
    const shipmentResult = await query("SELECT id FROM shipment WHERE distributor_id = $1", [distributorId]);
    const shipmentIds = shipmentResult.rows.map(row => row.id);
    if (shipmentIds.length === 0) return res.json([]);
    // Get blockchain events for these shipments
    const eventsResult = await query(
      `SELECT * FROM blockchaineventlog WHERE entitytype = 'shipment' AND entityid = ANY($1::int[]) ORDER BY timestamp DESC`,
      [shipmentIds]
    );
    res.json(eventsResult.rows);
  } catch (error) {
    res.status(500).json([]);
  }
}

// Regulator: Blockchain events for oversight
export async function regulatorBlockchainEvents(req, res) {
  try {
    // Regulator sees all events
    const eventsResult = await query(
      `SELECT * FROM blockchaineventlog ORDER BY timestamp DESC`
    );
    res.json(eventsResult.rows);
  } catch (error) {
    res.status(500).json([]);
  }
}