// Patient analytics aggregation
export async function fetchPatientAnalytics(userId) {
  // Get patient id
  const { rows: patientRows } = await query("SELECT id FROM patient WHERE userid=$1", [userId]);
  if (patientRows.length === 0) throw new Error("Patient record not found");
  const patientId = patientRows[0].id;

  // Get all prescriptions
  const { rows: prescriptions } = await query("SELECT * FROM prescription WHERE patient_id=$1 ORDER BY issue_date ASC", [patientId]);

  // Status breakdown
  const statusBreakdown = { active: 0, dispensed: 0, expired: 0 };
  prescriptions.forEach(p => {
    const status = (p.status || "").toLowerCase();
    if (status === "active") statusBreakdown.active++;
    else if (status === "dispensed") statusBreakdown.dispensed++;
    else if (status === "expired") statusBreakdown.expired++;
  });

  // Prescriptions over time (monthly count)
  const prescriptionsOverTime = {};
  prescriptions.forEach(p => {
    const month = p.issue_date ? p.issue_date.toISOString().slice(0,7) : "unknown";
    prescriptionsOverTime[month] = (prescriptionsOverTime[month] || 0) + 1;
  });

  // Doctor frequency
  const doctorFrequency = {};
  prescriptions.forEach(p => {
    if (p.doctor_name) doctorFrequency[p.doctor_name] = (doctorFrequency[p.doctor_name] || 0) + 1;
  });

  // Drug category breakdown (assuming drug_category field exists, else use drug_name)
  const categoryBreakdown = {};
  prescriptions.forEach(p => {
    const category = p.drug_category || p.drug_name || "Unknown";
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
  });

  // Top prescribed drugs
  const drugFrequency = {};
  prescriptions.forEach(p => {
    if (p.drug_name) drugFrequency[p.drug_name] = (drugFrequency[p.drug_name] || 0) + 1;
  });
  const topDrugs = Object.entries(drugFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([drug, count]) => ({ drug, count }));

  // Average prescriptions per month
  const months = Object.keys(prescriptionsOverTime).length;
  const totalPrescriptions = prescriptions.length;
  const avgPerMonth = months ? (totalPrescriptions / months) : 0;

  // Last scanned QR or recent activity (stub: returns last prescription)
  const lastActivity = prescriptions.length > 0 ? {
    prescriptionNo: prescriptions[prescriptions.length-1].id,
    date: prescriptions[prescriptions.length-1].issue_date,
    status: prescriptions[prescriptions.length-1].status,
    drug: prescriptions[prescriptions.length-1].drug_name,
  } : null;

  return {
    totalPrescriptions,
    statusBreakdown,
    prescriptionsOverTime,
    doctorFrequency,
    categoryBreakdown,
    topDrugs,
    avgPerMonth,
    lastActivity,
  };
}
// List all prescriptions for patient (with optional status filter)
export async function fetchPatientPrescriptions(userId, status) {
  let sql = "SELECT * FROM prescription WHERE patient_id = (SELECT id FROM patient WHERE userid = $1)";
  const params = [userId];
  if (status) {
    sql += " AND status = $2";
    params.push(status);
  }
  sql += " ORDER BY issue_date DESC";
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
// Enhanced dashboard logic for patient
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

  // Get all prescriptions
  const { rows: prescriptions } = await query(
    "SELECT * FROM prescription WHERE patient_id=$1 ORDER BY issue_date DESC",
    [patientId]
  );

  // Key stats
  const totalPrescriptions = prescriptions.length;
  const activePrescriptions = prescriptions.filter(p => p.status?.toLowerCase() === "active");
  const dispensedPrescriptions = prescriptions.filter(p => p.status?.toLowerCase() === "dispensed");
  const expiredPrescriptions = prescriptions.filter(p => p.status?.toLowerCase() === "expired");

  // Recent activity (last 5)
  const recentPrescriptions = prescriptions.slice(0, 5).map(p => ({
    prescriptionNo: p.id,
    doctorName: p.doctor_name,
    date: p.issue_date,
    status: p.status,
    drug: p.drug_name,
    qrCode: p.qr_code,
  }));

  // Status breakdown for chart
  const statusBreakdown = {
    active: activePrescriptions.length,
    dispensed: dispensedPrescriptions.length,
    expired: expiredPrescriptions.length,
  };

  // Drug frequency
  const drugFrequency = {};
  prescriptions.forEach(p => {
    if (p.drug_name) {
      drugFrequency[p.drug_name] = (drugFrequency[p.drug_name] || 0) + 1;
    }
  });

  // Doctor frequency
  const doctorFrequency = {};
  prescriptions.forEach(p => {
    if (p.doctor_name) {
      doctorFrequency[p.doctor_name] = (doctorFrequency[p.doctor_name] || 0) + 1;
    }
  });
  const topDoctor = Object.entries(doctorFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const topDrug = Object.entries(drugFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Timeline (last few issued)
  const timeline = prescriptions.slice(0, 5).map(p => ({
    prescriptionNo: p.id,
    date: p.issue_date,
    status: p.status,
    drug: p.drug_name,
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
