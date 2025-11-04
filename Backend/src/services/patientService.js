// Patient analytics aggregation - FIXED VERSION
export async function fetchPatientAnalytics(userId) {
  // Get patient id
  const { rows: patientRows } = await query("SELECT id FROM patient WHERE userid=$1", [userId]);
  if (patientRows.length === 0) throw new Error("Patient record not found");
  const patientId = patientRows[0].id;

  // Get all prescriptions with proper joins - FIXED QUERY
  const { rows: prescriptions } = await query(`
    SELECT 
      p.*,
      u.full_name as doctor_name,
      d.name as drug_name,
      d.dosageunit as drug_dosage_unit,
      CASE 
  WHEN p.valid_until < NOW() THEN 'expired'
  WHEN p.dispensed_date IS NOT NULL THEN 'dispensed' 
  ELSE 'issued'
      END as calculated_status
    FROM prescription p 
    LEFT JOIN doctor doc ON p.doctor_id = doc.id 
    LEFT JOIN users u ON doc.userid = u.id 
    LEFT JOIN drug d ON p.drug_id = d.id 
    WHERE p.patient_id=$1 
    ORDER BY p.issue_date ASC
  `, [patientId]);

  // Status breakdown - use calculated status based on dates
  const statusBreakdown = { issued: 0, dispensed: 0, expired: 0 };
  prescriptions.forEach(p => {
    const status = p.calculated_status;
    if (status === 'issued') statusBreakdown.issued++;
    else if (status === 'dispensed') statusBreakdown.dispensed++;
    else if (status === 'expired') statusBreakdown.expired++;
  });

  // Prescriptions over time (monthly count)
  const prescriptionsOverTime = {};
  prescriptions.forEach(p => {
    if (p.issue_date) {
      const month = p.issue_date.toISOString().slice(0, 7); // YYYY-MM format
      prescriptionsOverTime[month] = (prescriptionsOverTime[month] || 0) + 1;
    }
  });

  // Doctor frequency - use actual doctor names from users table
  const doctorFrequency = {};
  prescriptions.forEach(p => {
    const doctorName = p.doctor_name || 'Unknown Doctor';
    doctorFrequency[doctorName] = (doctorFrequency[doctorName] || 0) + 1;
  });

  // Drug category breakdown - use drug names since category table might not exist
  const categoryBreakdown = {};
  prescriptions.forEach(p => {
    const drugName = p.drug_name || 'Unknown Drug';
    categoryBreakdown[drugName] = (categoryBreakdown[drugName] || 0) + 1;
  });

  // Top prescribed drugs
  const drugFrequency = {};
  prescriptions.forEach(p => {
    if (p.drug_name) {
      drugFrequency[p.drug_name] = (drugFrequency[p.drug_name] || 0) + 1;
    }
  });
  
  const topDrugs = Object.entries(drugFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([drug, count]) => ({ drug, count }));

  // Average prescriptions per month
  const months = Object.keys(prescriptionsOverTime).length;
  const totalPrescriptions = prescriptions.length;
  const avgPerMonth = months > 0 ? (totalPrescriptions / months) : 0;

  // Last activity - get the most recent prescription
  const lastActivity = prescriptions.length > 0 ? {
    prescriptionNo: prescriptions[prescriptions.length - 1].prescription_code || `PRESC-${prescriptions[prescriptions.length - 1].id}`,
    date: prescriptions[prescriptions.length - 1].issue_date,
    drug: prescriptions[prescriptions.length - 1].drug_name || 'Unknown Drug',
  } : null;

  return {
    totalPrescriptions,
    statusBreakdown,
    prescriptionsOverTime,
    doctorFrequency,
    categoryBreakdown,
    topDrugs,
    avgPerMonth: parseFloat(avgPerMonth.toFixed(2)),
    lastActivity,
  };
}
// List all prescriptions for patient (with optional status filter)
export async function fetchPatientPrescriptions(userId, status) {
  let sql = `
    SELECT 
      p.*, 
      u.full_name as doctor_full_name,
      dg.name as drug_name_full,
      dg.dosageunit as drug_dosage_unit
    FROM prescription p 
    LEFT JOIN doctor doc ON p.doctor_id = doc.id 
    LEFT JOIN users u ON doc.userid = u.id 
    LEFT JOIN drug dg ON p.drug_id = dg.id 
    WHERE p.patient_id = (SELECT id FROM patient WHERE userid = $1)
  `;
  
  const params = [userId];
  
  if (status) {
    sql += " AND p.status = $2";
    params.push(status);
  }
  
  sql += " ORDER BY p.issue_date DESC";
  
  const { rows } = await query(sql, params);
  
  return rows.map(p => ({
    prescriptionNo: p.prescription_code || `RX-${String(p.id).padStart(5, '0')}`,
    doctorName: p.doctor_full_name || p.doctor_name || 'Unknown Doctor',
    date: p.issue_date,
    drug: p.drug_name_full || p.drug_name || 'Unknown Drug',
    status: p.status,
    hospital: p.hospital,
    qrCode: p.qr_code,
    dosage: p.dosage_amount ? `${p.dosage_amount} ${p.dosage_unit || p.drug_dosage_unit || 'mg'}` : 'N/A',
    duration: p.duration ? `${p.duration} days` : 'N/A',
    instructions: p.instructions || 'Take as directed'
  }));
}
// Get single prescription details
export async function fetchPrescriptionDetails(prescriptionId) {
  const { rows } = await query("SELECT * FROM prescription WHERE id = $1", [prescriptionId]);
  return rows[0] || null;
}

// Get QR code data for prescription
export async function fetchQRCodeData(prescriptionId) {
  const { rows } = await query("SELECT qr_code FROM prescription WHERE id = $1", [prescriptionId]);
  return rows[0]?.qr_code || null;
}

// Search prescriptions by drug/doctor name
export async function searchPatientPrescriptions(userId, queryStr) {
  const sql = `SELECT * FROM prescription WHERE patient_id = (SELECT id FROM patient WHERE userid = $1) AND (drug_name ILIKE $2 OR doctor_name ILIKE $2) ORDER BY issue_date DESC`;
  const params = [userId, `%${queryStr}%`];
  const { rows } = await query(sql, params);
  return rows.map(p => ({
    prescriptionNo: `RX-${String(p.id).padStart(5, '0')}`,
    doctorName: p.doctor_name,
    date: p.issue_date,
    drug: p.drug_name,
    status: p.status,
    hospital: p.hospital,
    qrCode: p.qr_code,
  }));
}

// Export prescriptions summary (stub: returns empty PDF buffer)
export async function exportPatientPrescriptions(userId) {
  // TODO: Implement PDF/CSV export logic
  return Buffer.from([]);
}
export async function fetchPatientDashboard(userId) {
  // Get user info
  const { rows: users } = await query(
    "SELECT id, full_name, email, wallet_address, role FROM users WHERE id=$1",
    [userId]
  );
  if (users.length === 0) throw new Error("User not found");
  const user = users[0];

  // Get patient record
  const { rows: patientRows } = await query(
    "SELECT id FROM patient WHERE userid=$1",
    [userId]
  );
  if (patientRows.length === 0) throw new Error("Patient record not found");
  const patientId = patientRows[0].id;

  // Get all prescriptions with proper doctor information - UPDATED QUERY
  const { rows: prescriptions } = await query(
    `SELECT p.*, u.full_name as doctor_full_name, dg.name as drug_name_full,
      CASE 
        WHEN p.valid_until < NOW() THEN 'expired'
        WHEN p.dispensed_date IS NOT NULL THEN 'dispensed' 
        ELSE 'active'
      END as calculated_status
     FROM prescription p 
     LEFT JOIN doctor d ON p.doctor_id = d.id 
     LEFT JOIN users u ON d.userid = u.id 
     LEFT JOIN drug dg ON p.drug_id = dg.id 
     WHERE p.patient_id=$1 
     ORDER BY p.issue_date DESC`,
    [patientId]
  );

  // Key stats - USE CALCULATED STATUS instead of database status
  const totalPrescriptions = prescriptions.length;
  
  // Count using calculated_status instead of p.status
  const activePrescriptions = prescriptions.filter(p => p.calculated_status === 'active');
  const dispensedPrescriptions = prescriptions.filter(p => p.calculated_status === 'dispensed');
  const expiredPrescriptions = prescriptions.filter(p => p.calculated_status === 'expired');

  // Recent activity (last 5) - USE CALCULATED STATUS
  const recentPrescriptions = prescriptions.slice(0, 5).map(p => ({
    prescriptionNo: p.prescription_code || `RX-${String(p.id).padStart(5, '0')}`,
    doctorName: p.doctor_full_name || p.doctor_name || 'Unknown Doctor',
    date: p.issue_date,
    status: p.calculated_status, // Use calculated status instead of p.status
    drug: p.drug_name_full || p.drug_name || 'Unknown Drug',
    qrCode: p.qr_code,
  }));

  // Status breakdown for chart - USE CALCULATED STATUS
  const statusBreakdown = {
    active: activePrescriptions.length,
    dispensed: dispensedPrescriptions.length,
    expired: expiredPrescriptions.length,
  };

  // Drug frequency - use drug name from drug table if available
  const drugFrequency = {};
  prescriptions.forEach(p => {
    const drugName = p.drug_name_full || p.drug_name;
    if (drugName) {
      drugFrequency[drugName] = (drugFrequency[drugName] || 0) + 1;
    }
  });

  // Doctor frequency - use doctor name from users table if available
  const doctorFrequency = {};
  prescriptions.forEach(p => {
    const doctorName = p.doctor_full_name || p.doctor_name;
    if (doctorName) {
      doctorFrequency[doctorName] = (doctorFrequency[doctorName] || 0) + 1;
    }
  });

  // Get top doctor and drug with proper fallbacks
  const topDoctor = Object.entries(doctorFrequency).length > 0 
    ? Object.entries(doctorFrequency).sort((a, b) => b[1] - a[1])[0][0] 
    : 'N/A';

  const topDrug = Object.entries(drugFrequency).length > 0
    ? Object.entries(drugFrequency).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  // Timeline (last few issued) - USE CALCULATED STATUS
  const timeline = prescriptions.slice(0, 5).map(p => ({
    prescriptionNo: p.prescription_code || `RX-${String(p.id).padStart(5, '0')}`,
    date: p.issue_date,
    status: p.calculated_status, // Use calculated status instead of p.status
    drug: p.drug_name_full || p.drug_name || 'Unknown Drug',
  }));

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    walletAddress: user.wallet_address,
    role: user.role,
    stats: {
      totalPrescriptions,
      activePrescriptions: activePrescriptions.length,
      dispensedPrescriptions: dispensedPrescriptions.length,
      expiredPrescriptions: expiredPrescriptions.length,
    },
    recentPrescriptions,
    statusBreakdown,
    drugFrequency,
    doctorFrequency,
    topDoctor,
    topDrug,
    timeline,
  };
}


import { query } from "../config/database.js";


async function getPatientByUserId(userId) {
  const { rows } = await query("SELECT * FROM patient WHERE userid = $1", [userId]);
  return rows[0] || null;
}


async function updatePatientByUserId(userId, updateData) {
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = [userId, ...keys.map(k => updateData[k])];
  await query(`UPDATE patient SET ${setClause} WHERE userid = $1`, values);
  const { rows } = await query("SELECT * FROM patient WHERE userid = $1", [userId]);
  return rows[0] || null;
}


async function searchPatients(searchTerm) {
  if (!searchTerm) {
    throw new Error("Query parameter is required");
  }
  const sql = `
    SELECT id, full_name, email, phone_number, gender, dob, user_code
    FROM users
    WHERE role = 'patient'
      AND (
        full_name ILIKE $1 OR
        email ILIKE $1 OR
        phone_number ILIKE $1 OR
        user_code ILIKE $1
      )
  `;
  const values = [`%${searchTerm}%`];
  const result = await query(sql, values);
  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number,
    gender: row.gender,
    dob: row.dob,
    userCode: row.user_code,
  }));
}

export { getPatientByUserId, updatePatientByUserId, searchPatients };
