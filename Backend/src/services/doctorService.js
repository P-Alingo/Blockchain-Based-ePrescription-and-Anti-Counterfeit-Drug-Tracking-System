// UPDATE prescription logic
async function updatePrescription(id, doctorId, updateData) {
  if (!doctorId) throw new Error("doctorId is required");
  // Only allow update of editable fields
  const allowed = ["dosageAmount", "dosageUnit", "frequency", "duration", "instructions"];
  const keys = Object.keys(updateData).filter(k => allowed.includes(k));
  if (keys.length === 0) return false;
  const setClause = keys.map((k, i) => `${snakeCase(k)} = $${i + 3}`).join(", ");
  const values = [id, doctorId, ...keys.map(k => updateData[k])];
  // Only update if prescription belongs to doctor
  const checkResult = await query(`SELECT id FROM prescription WHERE id = $1 AND doctor_id = $2;`, [id, doctorId]);
  if (checkResult.rowCount === 0) return false;
  await query(`UPDATE prescription SET ${setClause} WHERE id = $1 AND doctor_id = $2`, values);

  // Blockchain integration: update event
  let blockchainTxHash = null;
  let blockchainBlockNumber = null;
  let walletAddress = null;
  try {
    const contractPrescriptionId = await getContractPrescriptionId(id);
    console.log('[DEBUG] updatePrescription: DB ID:', id, 'Contract ID:', contractPrescriptionId);
    if (!contractPrescriptionId || contractPrescriptionId === id) {
      console.warn('[DEBUG] No contract prescription ID mapping found for DB ID', id, '— skipping blockchain update.');
    } else {
      const updatedPresRes = await query(
        `SELECT dosage_amount, dosage_unit, frequency, duration, instructions
         FROM prescription WHERE id = $1`,
        [id]
      );
      const updatedPrescription = updatedPresRes.rows[0] || {};
      // Use contract instance from config/blockchain.js
      const tx = await prescriptionManagementContract.updatePrescription(
        contractPrescriptionId,
        updatedPrescription.dosage_amount ?? updateData.dosageAmount,
        updatedPrescription.dosage_unit ?? updateData.dosageUnit,
        updatedPrescription.frequency ?? updateData.frequency,
        updatedPrescription.duration ?? updateData.duration,
        updatedPrescription.instructions ?? updateData.instructions
      );
      const receipt = await tx.wait();
      blockchainTxHash = receipt.transactionHash;
      blockchainBlockNumber = receipt.blockNumber;
      const doctorWalletRes = await query('SELECT wallet_address FROM users WHERE id = (SELECT userid FROM doctor WHERE id = $1)', [doctorId]);
      walletAddress = doctorWalletRes.rows[0]?.wallet_address || process.env.ADMIN_WALLET_ADDRESS || null;
    }
  } catch (err) {
    console.error('❌ Blockchain prescription update failed:', err);
  }
  // Log blockchain event only if transaction hash and block number are present
  if (blockchainTxHash && blockchainBlockNumber && walletAddress) {
    try {
      const eventname = 'PrescriptionUpdated';
      const contractname = 'PrescriptionManagement';
      const entityid = id;
      const entitytype = 'prescription';
      const transactionhash = blockchainTxHash;
      const blocknumber = blockchainBlockNumber;
      const timestamp = new Date().toISOString();
      const details = JSON.stringify(updateData);
      await query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, processed, wallet_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, false, walletAddress]
      );
        console.log(`[BLOCKCHAIN LOG] PrescriptionUpdated: TxHash=${transactionhash}, BlockNumber=${blocknumber}, EntityID=${entityid}`);
    } catch (err) {
      console.error('❌ Failed to log blockchain event:', err);
    }
  }
  return true;
}
import { query } from "../config/database.js";
import fs from 'fs';
import path from 'path';
import { prescriptionManagementContract } from '../config/blockchain.js';
import { ethers } from 'ethers';

// Helper to convert camelCase to snake_case
function snakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Helper: Load prescription ID mapping
async function getContractPrescriptionId(databaseId) {
  try {
    // Use correct mapping file path
    const mapPath = path.resolve(process.cwd(), 'prescription_id_map.json');
    let contractPrescriptionId = databaseId;
    let mappingFound = false;
    if (fs.existsSync(mapPath)) {
      try {
        const mappings = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        for (const obj of mappings) {
          if (obj.databaseId == databaseId) {
            contractPrescriptionId = obj.contractPrescriptionId;
            mappingFound = true;
            break;
          }
        }
      } catch (err) {
        console.warn(`[MAPPING WARNING] Failed to parse mapping file: ${err}`);
      }
    }
    if (!mappingFound) {
      // Try to recover mapping from blockchain
      try {
        const dbRes = await query('SELECT prescription_code FROM prescription WHERE id = $1', [databaseId]);
        const prescriptionCode = dbRes.rows[0]?.prescription_code;
        if (prescriptionCode) {
          const { getPrescriptionByCodeOnChain } = await import('./blockchainService.js');
          const contractPresc = await getPrescriptionByCodeOnChain(prescriptionCode);
          if (contractPresc && contractPresc.id && (typeof contractPresc.id === 'string' || typeof contractPresc.id === 'number')) {
            contractPrescriptionId = contractPresc.id.toString();
            // Always write as JSON array
            let mappings = [];
            if (fs.existsSync(mapPath)) {
              try {
                mappings = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
              } catch (err) {
                mappings = [];
              }
            }
            // Remove any previous mapping for this prescriptionId
            mappings = mappings.filter(obj => obj.databaseId != databaseId);
            mappings.push({ databaseId, contractPrescriptionId });
            try {
              fs.writeFileSync(mapPath, JSON.stringify(mappings, null, 2));
              console.log(`[MAPPING RECOVERY] Saved recovered mapping: DB ID=${databaseId}, Contract ID=${contractPrescriptionId} to ${mapPath}`);
            } catch (err) {
              console.error(`[MAPPING ERROR] Failed to write recovered mapping for DB ID=${databaseId}, Contract ID=${contractPrescriptionId} to ${mapPath}:`, err);
            }
          } else {
            console.warn(`[MAPPING WARNING] Could not recover contract prescription ID for DB ID=${databaseId} using code=${prescriptionCode}.`);
          }
        } else {
          console.warn(`[MAPPING WARNING] No prescription code found for DB ID=${databaseId} during mapping recovery.`);
        }
      } catch (err) {
        console.error(`[MAPPING ERROR] Recovery failed for DB ID=${databaseId}:`, err);
      }
    }
    // Ensure return value is string or number, never object or undefined
    if (typeof contractPrescriptionId === 'string' || typeof contractPrescriptionId === 'number') {
      return contractPrescriptionId;
    }
    return databaseId;
  } catch (err) {
    return databaseId;
  }
}

// Expose query helper for doctorController dashboard logic
// (query is already required above)

// Prescription CRUD and search logic
async function createPrescription({
  doctorId,
  patientId,
  drugId,
  dosageAmount,
  dosageUnit,
  frequency,
  duration,
  instructions,
  issueDate,
  validUntil,
  quantity
}) {
  if (isNaN(duration)) throw new Error("Duration must be a number");
  if (isNaN(quantity)) throw new Error("Quantity must be a number");
  const today = new Date();
  const issueDateObj = new Date(issueDate);
  const validUntilObj = new Date(validUntil);
  if (isNaN(issueDateObj) || isNaN(validUntilObj)) throw new Error("Invalid dates provided");
  let status = "issued";
  if (today > validUntilObj) status = "expired";
  // Generate unique prescription code
  const prescriptionCode = `PRESC-${Math.floor(100000 + Math.random() * 900000)}`;
  const insertText = `
    INSERT INTO prescription
      (patient_id, doctor_id, drug_id, issue_date, valid_until, status, instructions, prescription_code, dosage_amount, dosage_unit, frequency, duration, quantity)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *;
  `;
  const insertValues = [
    patientId,
    doctorId,
    drugId,
    issueDate,
    validUntil,
    status,
    instructions,
    prescriptionCode,
    dosageAmount,
    dosageUnit,
    frequency,
    duration,
    quantity
  ];
  // Blockchain integration first
  // Fetch patient wallet address only
  const patientWalletRes = await query('SELECT wallet_address FROM users WHERE id = (SELECT userid FROM patient WHERE id = $1)', [patientId]);
  const patientWallet = patientWalletRes.rows[0]?.wallet_address;
  const isValidEthAddress = (addr) => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
  console.log(`[DEBUG] Patient wallet address for patientId ${patientId}: ${patientWallet}`);
  if (!isValidEthAddress(patientWallet)) {
    throw new Error('Patient wallet address is missing or invalid. Please ensure the patient has a valid wallet_address.');
  }

  // Fetch drug name from drug table
  const drugRes = await query('SELECT name FROM drug WHERE id = $1', [drugId]);
  const drugName = drugRes.rows[0]?.name || '';
    // Fetch doctor wallet address
    const doctorWalletRes = await query('SELECT wallet_address FROM users WHERE id = (SELECT userid FROM doctor WHERE id = $1)', [doctorId]);
    const doctorWalletAddr = doctorWalletRes.rows[0]?.wallet_address;

  // Prepare blockchain params
  const blockchainParams = {
    databaseId: null, // will be set after DB insert
    doctor: doctorWalletAddr, // Use doctor as required by contract
    patient: patientWallet,
    prescriptionCode,
    drugId,
    drugName,
    strength: dosageAmount?.toString(),
    form: dosageUnit?.toString(),
    quantity,
    instructions,
    dosageAmount: dosageAmount?.toString(),
    dosageUnit: dosageUnit?.toString(),
    frequency,
    duration,
    validUntil: Math.floor(new Date(validUntil).getTime() / 1000)
  };
  let blockchainTxHash = null;
  let blockchainBlockNumber = null;
  let contractPrescriptionIdCheck = null;
  let doctorWallet = process.env.ADMIN_WALLET_ADDRESS || null;
  let prescriptionId = null;
  let prescriptionRow = null;
  try {
    // First, insert into DB to get prescriptionId
    const insertResult = await query(insertText, insertValues);
    prescriptionRow = insertResult.rows[0];
    prescriptionId = prescriptionRow.id;
    blockchainParams.databaseId = prescriptionId;
    blockchainParams.prescriptionCode = prescriptionRow.prescription_code;
    blockchainParams.strength = prescriptionRow.dosage_amount?.toString() || dosageAmount?.toString();
    blockchainParams.form = prescriptionRow.dosage_unit?.toString() || dosageUnit?.toString();
    blockchainParams.dosageAmount = prescriptionRow.dosage_amount?.toString() || dosageAmount?.toString();
    blockchainParams.dosageUnit = prescriptionRow.dosage_unit?.toString() || dosageUnit?.toString();
    blockchainParams.quantity = Number(prescriptionRow.quantity);
    blockchainParams.instructions = prescriptionRow.instructions;
    blockchainParams.frequency = prescriptionRow.frequency;
    blockchainParams.duration = Number(prescriptionRow.duration);
    blockchainParams.validUntil = Math.floor(new Date(prescriptionRow.valid_until).getTime() / 1000);
    console.log('[DEBUG] BlockchainParams before contract call:', JSON.stringify(blockchainParams, null, 2));

    // Use contract instance from config/blockchain.js
    const { prescriptionManagementContract } = await import('../config/blockchain.js');
    const tx = await prescriptionManagementContract.createPrescription(
      blockchainParams.databaseId,
      blockchainParams.doctor,
      blockchainParams.patient,
      blockchainParams.prescriptionCode,
      blockchainParams.drugId,
      blockchainParams.drugName,
      blockchainParams.strength,
      blockchainParams.form,
      blockchainParams.quantity,
      blockchainParams.instructions,
      blockchainParams.dosageAmount,
      blockchainParams.dosageUnit,
      blockchainParams.frequency,
      blockchainParams.duration,
      blockchainParams.validUntil
    );
    const receipt = await tx.wait();
    blockchainTxHash = receipt.transactionHash;
    blockchainBlockNumber = receipt.blockNumber;
    // Save contract prescription ID mapping
    const contractPrescriptionId = receipt.events?.find(e => e.event === 'PrescriptionCreated')?.args?.prescriptionId?.toString();
    if (contractPrescriptionId) {
      const mapPath = path.resolve(process.cwd(), 'prescription_id_map.json');
      let mappings = [];
      if (fs.existsSync(mapPath)) {
        try {
          mappings = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        } catch (err) {
          console.warn(`[MAPPING WARNING] Failed to parse mapping file: ${err}`);
          mappings = [];
        }
      }
      // Remove any previous mapping for this prescriptionId
      mappings = mappings.filter(obj => obj.databaseId != prescriptionId);
      // Add new mapping
      mappings.push({ databaseId: prescriptionId, contractPrescriptionId, transactionHash: blockchainTxHash, blockNumber: blockchainBlockNumber });
      try {
        fs.writeFileSync(mapPath, JSON.stringify(mappings, null, 2));
        console.log(`[MAPPING WRITE] Saved mapping: DB ID=${prescriptionId}, Contract ID=${contractPrescriptionId}, TxHash=${blockchainTxHash}, BlockNumber=${blockchainBlockNumber} to ${mapPath}`);
      } catch (err) {
        console.error(`[MAPPING ERROR] Failed to write mapping for DB ID=${prescriptionId}, Contract ID=${contractPrescriptionId} to ${mapPath}:`, err);
      }
      // Check on-chain prescription details for verification
      try {
        contractPrescriptionIdCheck = await getPrescriptionOnChain(contractPrescriptionId);
        console.log('[ON-CHAIN VERIFY] Prescription', contractPrescriptionId, 'details:', contractPrescriptionIdCheck);
      } catch (verifyErr) {
        console.error('[ON-CHAIN VERIFY] Failed to fetch prescription from chain:', verifyErr);
      }
    } else {
      // Rollback DB insert if blockchain failed
      await query('DELETE FROM prescription WHERE id = $1', [prescriptionId]);
      throw new Error(`[MAPPING WARNING] No contract prescription ID found for DB ID=${prescriptionId} after creation. Receipt: ${JSON.stringify(receipt)}`);
    }
  } catch (err) {
    console.error('❌ Blockchain prescription creation failed:', err);
    // Rollback DB insert if blockchain failed
    if (prescriptionId) {
      await query('DELETE FROM prescription WHERE id = $1', [prescriptionId]);
    }
    throw err;
  }

  // Log blockchain event only if transaction hash, block number, and doctor wallet are present
  if (blockchainTxHash && blockchainBlockNumber && doctorWallet) {
    try {
      const eventname = 'PrescriptionCreated';
      const contractname = 'PrescriptionManagement';
      const entityid = prescriptionId;
      const entitytype = 'prescription';
      const transactionhash = blockchainTxHash;
      const blocknumber = blockchainBlockNumber;
      const timestamp = new Date().toISOString();
      await query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, processed, wallet_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (transactionhash) DO NOTHING`,
        [eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, true, doctorWallet]
      );
        console.log(`[BLOCKCHAIN LOG] PrescriptionCreated: TxHash=${transactionhash}, BlockNumber=${blocknumber}, EntityID=${entityid}`);
    } catch (err) {
      console.error('❌ Failed to log blockchain event:', err);
    }
  }

  // Fetch prescription details for return
  const result = await query(
    'SELECT p.id, p.doctor_id, p.patient_id, u.full_name AS patient_name, u.dob AS patient_dob, d.name AS drug_name, p.dosage_amount, p.dosage_unit, p.frequency, p.duration, p.instructions, p.issue_date, p.valid_until, p.status, p.prescription_code, p.quantity FROM prescription p JOIN patient pt ON pt.id = p.patient_id JOIN users u ON u.id = pt.userid JOIN drug d ON d.id = p.drug_id WHERE p.id = $1;',
    [prescriptionId]
  );
  return { ...result.rows[0], blockchainTxHash, blockchainBlockNumber };
}

async function getPrescriptionsByDoctor(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const result = await query(
    `SELECT 
        p.id,
        p.dosage_amount,
        p.dosage_unit,
        p.frequency,
        p.duration,
        p.instructions,
        p.issue_date,
        p.valid_until,
        p.status,
        p.quantity,
        pat.id AS patient_id,
        u.full_name AS patient_name,
        u.dob AS patient_dob,
        d.name AS drug_name
     FROM prescription p
     JOIN patient pat ON pat.id = p.patient_id
     JOIN users u ON u.id = pat.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.doctor_id = $1 AND (p.is_deleted IS NULL OR p.is_deleted = false)
     ORDER BY p.issue_date DESC;`,
    [doctorId]
  );
    // For each prescription, check if any blockchain event exists
    const prescriptions = await Promise.all((result.rows ?? []).map(async (row) => {
      let contractId;
      try {
        contractId = await getContractPrescriptionId(row.id);
      } catch (err) {
        contractId = row.id;
      }
      // Ensure contractId is string or number
      if (typeof contractId !== 'string' && typeof contractId !== 'number') {
        contractId = row.id;
      }
      const eventRes = await query(
        "SELECT 1 FROM blockchaineventlog WHERE entitytype = 'prescription' AND entityid = $1 LIMIT 1",
        [contractId]
      );
      return {
        ...row,
        blockchain_synced: eventRes.rowCount > 0
      };
    }));
    return prescriptions;
}

async function getPrescriptionById(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const result = await query(
    'SELECT p.id, p.doctor_id, p.patient_id, u.full_name AS patient_name, u.dob AS patient_dob, d.name AS drug_name, p.dosage_amount, p.dosage_unit, p.frequency, p.duration, p.instructions, p.issue_date, p.valid_until, p.status, p.prescription_code, p.quantity FROM prescription p JOIN patient pt ON pt.id = p.patient_id JOIN users u ON u.id = pt.userid JOIN drug d ON d.id = p.drug_id WHERE p.id = $1 AND p.doctor_id = $2;',
    [id, doctorId]
  );
  return result.rows[0] || null;
}

async function deletePrescription(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  let blockchainTxHash = null;
  let blockchainBlockNumber = null;
  let walletAddress = null;
  // Delete from database
  const checkResult = await query('SELECT id FROM prescription WHERE id = $1 AND doctor_id = $2;', [id, doctorId]);
  if (checkResult.rowCount === 0) return false;
  // Soft delete in database
  await query('UPDATE prescription SET is_deleted = true WHERE id = $1 AND doctor_id = $2;', [id, doctorId]);
  // Blockchain integration: delete event
  try {
    const contractPrescriptionId = await getContractPrescriptionId(id);
    if (contractPrescriptionId === id) {
      console.warn('No contract prescription ID mapping found for database ID ' + id + '. Skipping blockchain delete.');
    } else {
      // Use admin wallet for blockchain delete (soft delete on-chain)
      // Use contract instance from config/blockchain.js
      const tx = await prescriptionManagementContract.deletePrescription(contractPrescriptionId);
      const receipt = await tx.wait();
      blockchainTxHash = receipt.transactionHash;
      blockchainBlockNumber = receipt.blockNumber;
      walletAddress = process.env.ADMIN_WALLET_ADDRESS || null;
    }
  } catch (err) {
    console.error('❌ Blockchain prescription delete failed:', err);
  }
  // Log blockchain event only if transaction hash, block number, and wallet address are present
  if (blockchainTxHash && blockchainBlockNumber && walletAddress) {
    try {
      const eventname = 'PrescriptionDeleted';
      const contractname = 'PrescriptionManagement';
      const entityid = id;
      const entitytype = 'prescription';
      const transactionhash = blockchainTxHash;
      const blocknumber = blockchainBlockNumber;
      const timestamp = new Date().toISOString();
      const details = JSON.stringify({ deleted: true });
      await query(
        'INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, processed, wallet_address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, false, walletAddress]
      );
        console.log(`[BLOCKCHAIN LOG] PrescriptionDeleted: TxHash=${transactionhash}, BlockNumber=${blocknumber}, EntityID=${entityid}`);
    } catch (err) {
      console.error('❌ Failed to log blockchain event:', err);
    }
  }
  return true;
}

async function searchDrugs(queryString) {
  if (!queryString || queryString.trim().length === 0) return [];
  const result = await query(
    'SELECT id, name, code, formulation, dosageunit FROM drug WHERE LOWER(name) LIKE LOWER($1) ORDER BY name ASC LIMIT 10;',
    [`%${queryString.trim()}%`]
  );
  return result.rows ?? [];
}

async function searchPatients(queryString) {
  if (!queryString || queryString.trim().length === 0) return [];
  const cleaned = queryString.trim();
  const isNumeric = /^\d+$/.test(cleaned);
  const sql = isNumeric
    ? 'SELECT p.id AS patient_id, u.id AS user_id, u.full_name, u.phone_number, u.gender, u.dob FROM patient p JOIN users u ON u.id = p.userid WHERE CAST(p.id AS TEXT) = $1 ORDER BY u.full_name ASC LIMIT 10;'
    : 'SELECT p.id AS patient_id, u.id AS user_id, u.full_name, u.phone_number, u.gender, u.dob FROM patient p JOIN users u ON u.id = p.userid WHERE LOWER(u.full_name) LIKE LOWER($1) ORDER BY u.full_name ASC LIMIT 10;';
  const result = await query(sql, [isNumeric ? cleaned : `%${cleaned}%`]);
  return result.rows ?? [];
}

async function getDoctorByUserId(userId) {
  const { rows } = await query("SELECT * FROM doctor WHERE userid = $1", [userId]);
  return rows[0] || null;
}

async function updateDoctorByUserId(userId, updateData) {
  // Build dynamic SQL for updateData keys
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  const setClause = keys.map((k, i) => k + ' = $' + (i + 2)).join(', ');
  const values = [userId, ...keys.map(k => updateData[k])];
  await query('UPDATE doctor SET ' + setClause + ' WHERE userid = $1', values);
  const { rows } = await query("SELECT * FROM doctor WHERE userid = $1", [userId]);
  return rows[0] || null;
}

// In doctorService.js - getDoctorAnalytics function
async function getDoctorAnalytics(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  
  console.log('Fetching analytics for doctorId:', doctorId);

  // Stat cards
  const statCardsQuery = 'SELECT COUNT(*) AS total_prescriptions, COUNT(*) FILTER (WHERE issue_date >= CURRENT_DATE - INTERVAL \'30 days\') AS last_30_days, COUNT(DISTINCT patient_id) AS unique_patients, MIN(issue_date) AS first_prescription, MAX(issue_date) AS last_prescription FROM prescription WHERE doctor_id = $1;';
  const statCardsResult = await query(statCardsQuery, [doctorId]);
  const stats = statCardsResult.rows[0] || {};

  const monthlyTrendsQuery = 'SELECT TO_CHAR(issue_date, \'YYYY-MM\') AS month, COUNT(*) AS count FROM prescription WHERE doctor_id = $1 GROUP BY TO_CHAR(issue_date, \'YYYY-MM\') ORDER BY month DESC LIMIT 12;';
  const monthlyTrendsResult = await query(monthlyTrendsQuery, [doctorId]);

  // Calculate averages
  const months = monthlyTrendsResult.rows.length;
  const totalPrescriptions = monthlyTrendsResult.rows.reduce((sum, row) => sum + Number(row.count), 0);
  const avg_per_month = months > 0 ? (totalPrescriptions / months) : 0;
  const avg_per_week = months > 0 ? (totalPrescriptions / (months * 4.345)) : 0; // 4.345 weeks per month

  const statusBreakdownQuery = 'SELECT status, COUNT(*) AS count FROM prescription WHERE doctor_id = $1 GROUP BY status ORDER BY count DESC;';
  const statusBreakdownResult = await query(statusBreakdownQuery, [doctorId]);

  const topDrugsQuery = 'SELECT d.name AS drug_name, COUNT(*) AS count FROM prescription p JOIN drug d ON d.id = p.drug_id WHERE p.doctor_id = $1 GROUP BY d.id, d.name ORDER BY count DESC LIMIT 5;';
  const topDrugsResult = await query(topDrugsQuery, [doctorId]);

  const patientTrendsQuery = 'SELECT TO_CHAR(issue_date, \'YYYY-MM\') AS month, COUNT(DISTINCT patient_id) AS count FROM prescription WHERE doctor_id = $1 GROUP BY TO_CHAR(issue_date, \'YYYY-MM\') ORDER BY month DESC LIMIT 12;';
  const patientTrendsResult = await query(patientTrendsQuery, [doctorId]);

  return {
    statCards: {
      total_prescriptions: stats.total_prescriptions ?? 0,
      last_30_days: stats.last_30_days ?? 0,
      unique_patients: stats.unique_patients ?? 0,
      avg_per_month,
      avg_per_week
    },
    monthlyTrends: monthlyTrendsResult.rows,
    statusBreakdown: statusBreakdownResult.rows,
    topDrugs: topDrugsResult.rows,
    patientTrends: patientTrendsResult.rows
  };
}

// Get all expired prescriptions for a doctor
async function getExpiredPrescriptions(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const result = await query(
    "SELECT * FROM prescription WHERE doctor_id = $1 AND status = 'expired' ORDER BY issue_date DESC;",
    [doctorId]
  );
  // Add blockchain_synced property for each expired prescription
  const prescriptions = await Promise.all((result.rows ?? []).map(async (row) => {
    const contractId = getContractPrescriptionId(row.id);
    const eventRes = await query(
      `SELECT 1 FROM blockchaineventlog WHERE entitytype = 'prescription' AND entityid = $1 LIMIT 1`,
      [contractId]
    );
    return {
      ...row,
      blockchain_synced: eventRes.rowCount > 0
    };
  }));
  return prescriptions;
}

export {
  updatePrescription,
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  deletePrescription,
  searchDrugs,
  searchPatients,
  getDoctorByUserId,
  updateDoctorByUserId,
  getDoctorAnalytics,
  getExpiredPrescriptions,
  query
};
// End of doctorService.js