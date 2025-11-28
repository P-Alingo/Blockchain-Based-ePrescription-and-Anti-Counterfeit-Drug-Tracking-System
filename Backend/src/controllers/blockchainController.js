// Regulator: Update violator status (suspend/activate)
export async function updateViolatorStatus(req, res) {
  try {
    const userId = req.params.userid;
    const { status, reason } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    // Fetch wallet address
    const userRes = await query('SELECT wallet_address FROM users WHERE id = $1', [userId]);
    const walletAddress = userRes.rows[0]?.wallet_address;
    if (!walletAddress) {
      return res.status(404).json({ success: false, message: 'User wallet address not found' });
    }
    // Call RegulatorOversight contract for suspension/reactivation
    try {
      const { suspendUserOnChain, liftUserSuspensionOnChain } = await import('../services/blockchainService.js');
      if (status === 'suspended') {
        await suspendUserOnChain(walletAddress, reason || 'Suspended by regulator');
      } else if (status === 'active') {
        await liftUserSuspensionOnChain(walletAddress);
      }
    } catch (err) {
      console.error('[Blockchain] Failed to call RegulatorOversight contract:', err);
    }
    // Update DB status
    await query('UPDATE users SET status = $1, updatedat = NOW() WHERE id = $2', [status, userId]);
    // Log blockchain event via RegulatorOversight contract
    try {
      const { logAuditOnChain } = await import('../services/blockchainService.js');
      await logAuditOnChain({
        description: `User status changed to '${status}' for userId=${userId} by regulator=${req.user?.id || 'regulator'}`,
        entityType: 'user',
        entityId: userId
      });
    } catch (err) {
      console.error('[Blockchain] Failed to log RegulatorOversight status change event:', err);
    }
    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
// Get manufacturer users whose batch was flagged, who flagged it, and their status
export async function regulatorManufacturerViolations(req, res) {
  try {
    // Fetch flagged shipments
    const shipmentsRes = await query(`
      SELECT s.*, 
        u_flagger.full_name AS flagged_by_name, u_flagger.role AS flagged_by_role,
        u_violator.full_name AS violator_name, u_violator.role AS violator_role, u_violator.status AS violator_status
      FROM shipment s
      LEFT JOIN users u_flagger ON s.flagged_by = u_flagger.id
      LEFT JOIN users u_violator ON s.violator = u_violator.id
      WHERE s.status = 'flagged'
      ORDER BY s.updated_at DESC
    `);
    const flaggedShipments = shipmentsRes.rows;

    // Prepare results array
    const results = [];
    for (const shipment of flaggedShipments) {
      results.push({
        shipment_id: shipment.id,
        violator_id: shipment.violator,
        violator_role: shipment.violator_role || 'Unknown',
        violator_name: shipment.violator_name || 'Unknown',
        violator_status: shipment.violator_status || 'Unknown',
        flagged_by_role: shipment.flagged_by_role || 'Unknown',
        flagged_by_id: shipment.flagged_by,
        flagged_by_name: shipment.flagged_by_name || 'Unknown',
        reason: shipment.received_condition || shipment.flag_reason || shipment.reason || shipment.status,
        timestamp: shipment.updated_at,
        status: shipment.status
      });
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Toggle manufacturer user status (active/suspended)
export async function regulatorToggleManufacturerStatus(req, res) {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await query('UPDATE users SET status = $1, updatedat = NOW() WHERE id = $2', [status, userId]);

    // Log suspension/activation on-chain via RegulatorOversight contract
    try {
      const { suspendUserOnChain, liftUserSuspensionOnChain } = await import('../services/blockchainService.js');
      // Get violator wallet address
      const userRes = await query('SELECT wallet_address FROM users WHERE id = $1', [userId]);
      const walletAddress = userRes.rows[0]?.wallet_address;
      if (walletAddress) {
        if (status === 'suspended') {
          await suspendUserOnChain(walletAddress, 'Suspended by regulator');
        } else if (status === 'active') {
          await liftUserSuspensionOnChain(walletAddress);
        }
      }
    } catch (err) {
      console.error('❌ Failed to call RegulatorOversight suspension functions:', err);
    }

    res.json({ success: true, message: `User status updated to ${status}` });
  } 
  catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get suspended users from users table
export async function regulatorSuspendedUsers(req, res) {
  try {
    const result = await query("SELECT * FROM users WHERE status = 'suspended' ORDER BY updatedat DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Activate a suspended user
export async function regulatorActivateUser(req, res) {
  try {
    const userId = req.params.id;
    await query("UPDATE users SET status = 'active', updatedat = NOW() WHERE id = $1", [userId]);
    res.json({ success: true, message: 'User activated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
// Get flagged batches from shipment table
// ...existing code...
// Get flagged batches (RegulatorOversight contract)
// ...existing code...
// Get contractPrescriptionId mapping for a given database prescription ID
// Get on-chain status for a contractPrescriptionId
export async function blockchainPrescriptionStatus(req, res) {
  try {
    const contractPrescriptionId = req.params.id;
    const { getPrescriptionOnChain } = await import("../services/blockchainService.js");
    const presc = await getPrescriptionOnChain(contractPrescriptionId);
    let status = null;
    // Try to extract status from array (index 12), object property, or fallback
    function extractStatus(raw) {
      let val = null;
      if (raw && typeof raw === 'object' && raw.hex) {
        val = parseInt(raw.hex, 16);
      } else if (typeof raw === 'number') {
        val = raw;
      } else if (typeof raw === 'string' && !isNaN(Number(raw))) {
        val = Number(raw);
      }
      // Only accept valid status values (0,1,2)
      if (val !== null && [0,1,2].includes(val)) return val;
      return null;
    }

    if (Array.isArray(presc)) {
      status = extractStatus(presc[12]);
    } else if (presc && typeof presc.status !== 'undefined') {
      status = extractStatus(presc.status);
    }
    // Fallback: try to find a valid status value anywhere in the array
    if (status === null && Array.isArray(presc)) {
      for (const v of presc) {
        const candidate = extractStatus(v);
        if (candidate !== null) {
          status = candidate;
          break;
        }
      }
    }
    // Extra debug logging for unexpected status values
    if (status === null || typeof status === 'undefined' || isNaN(status)) {
      console.error('[DEBUG] Unexpected prescription status value:', {
        contractPrescriptionId,
        presc,
        extractedStatus: status
      });
      return res.status(404).json({ message: 'Status not found for this prescription', debug: { contractPrescriptionId, presc, extractedStatus: status } });
    }
    res.json({ status });
  } catch (error) {
    res.status(404).json({ message: error.message || 'Prescription not found on-chain' });
  }
}
import fs from 'fs';
import path from 'path';
export async function blockchainPrescriptionMap(req, res) {
  try {
    const prescriptionId = req.params.id;
    const mapPath = path.resolve(__dirname, '../../prescription_id_map.json');
    if (!fs.existsSync(mapPath)) {
      return res.status(404).json({ success: false, message: 'Mapping file not found' });
    }
    const mappings = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const mapping = mappings.find(obj => String(obj.databaseId) === String(prescriptionId));
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found for this prescription ID' });
    }
    res.json({ contractPrescriptionId: mapping.contractPrescriptionId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
// Centralized Blockchain Controller
// Debug: Get all on-chain prescriptions
export async function blockchainAllPrescriptions(req, res) {
  try {
    const { getAllPrescriptionsOnChain } = await import("../services/blockchainService.js");
    const prescriptions = await getAllPrescriptionsOnChain();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
import { 
  getBlockchainHealth, 
  getAllBlockchainEvents, 
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
  console.log("📨 [DEBUG] /api/blockchain/events endpoint hit");
  try {
    const events = await getAllBlockchainEvents();
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
    // Always set badge for frontend mapping
    const badge = status.is_synced === true ? 'synced' : 'not_synced';
    res.json({ success: true, ...status, badge });
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