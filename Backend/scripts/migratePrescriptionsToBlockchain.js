// migratePrescriptionsToBlockchain.js
// Usage: node migratePrescriptionsToBlockchain.js
// This script reads all prescriptions from the database and creates them on-chain

import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DB Setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/eprescribe_kenya',
});

// --- Blockchain Setup ---
const prescriptionArtifactPath = path.resolve(
  __dirname,
  '../../Smart Contracts/artifacts/contracts/PrescriptionManagement.sol/PrescriptionManagement.json'
);
const prescriptionArtifact = JSON.parse(fs.readFileSync(prescriptionArtifactPath, 'utf8'));
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// Helper: get doctor's private key (implement as needed)
async function getDoctorPrivateKey(doctorId) {
  // Reads private key from .env as DOCTOR_<doctorId>_PRIVATE_KEY
  const envKey = `DOCTOR_${doctorId}_PRIVATE_KEY`;
  const pk = process.env[envKey];
  if (!pk) throw new Error(`Private key not found in .env for ${envKey}`);
  return pk.startsWith('0x') ? pk : '0x' + pk;
}

async function getWalletAddress(table, id) {
  // table: 'doctor' or 'patient'
  const res = await pool.query(
    `SELECT u.wallet_address FROM ${table} t JOIN users u ON t.userid = u.id WHERE t.id = $1`,
    [id]
  );
  return res.rows[0]?.wallet_address || null;
}

async function migrate() {
  const prescRes = await pool.query('SELECT * FROM prescription');
  for (const p of prescRes.rows) {
    try {
      const patientWallet = await getWalletAddress('patient', p.patient_id);
      const doctorWallet = await getWalletAddress('doctor', p.doctor_id);
      const drugRes = await pool.query('SELECT name FROM drug WHERE id = $1', [p.drug_id]);
      const drugName = drugRes.rows[0]?.name || '';
      const validUntilUnix = Math.floor(new Date(p.valid_until).getTime() / 1000);
      // Convert quantity and duration to integers
      const quantityInt = parseInt(p.quantity, 10);
      const durationInt = parseInt(p.duration, 10);
      // Prepare contract params
      const params = [
        p.id, // databaseId
        patientWallet,
        p.prescription_code,
        p.drug_id,
        drugName,
        p.dosage_amount.toString(), // strength
        p.dosage_unit,
        quantityInt,
        p.instructions || '',
        p.dosage_amount.toString(),
        p.dosage_unit,
        p.frequency,
        durationInt,
        validUntilUnix
      ];

      // --- Doctor signer setup ---
      let doctorPrivateKey;
      try {
        doctorPrivateKey = await getDoctorPrivateKey(p.doctor_id);
      } catch (err) {
        throw new Error(`Doctor private key not found for doctor_id ${p.doctor_id}: ${err.message}`);
      }
      const doctorSigner = new ethers.Wallet(doctorPrivateKey, provider);
      const contract = new ethers.Contract(
        process.env.PRESCRIPTION_MANAGEMENT_ADDRESS,
        prescriptionArtifact.abi,
        doctorSigner
      );

      // Check if already exists on-chain (optional)
      // await contract.getPrescription(p.id).catch(() => null);
      console.log(`Migrating prescription ${p.id} (${p.prescription_code}) as doctor ${doctorWallet}...`);
      const tx = await contract.createPrescription(...params);
      const receipt = await tx.wait();
      // Find the PrescriptionCreated event
      const event = receipt.events && receipt.events.find(e => e.event === 'PrescriptionCreated');
      if (event) {
        const contractPrescriptionId = event.args.prescriptionId.toNumber();
        // Save mapping to a file (append mode)
        fs.appendFileSync('prescription_id_map.json', JSON.stringify({
          databaseId: p.id,
          contractPrescriptionId
        }) + '\n');
        console.log(`Mapped DB ID ${p.id} to contract ID ${contractPrescriptionId}`);
      }
      console.log(`✅ Prescription ${p.id} migrated. Tx: ${tx.hash}`);
    } catch (err) {
      console.error(`❌ Failed to migrate prescription ${p.id}:`, err.message);
    }
  }
  await pool.end();
}

migrate().then(() => {
  console.log('Migration complete.');
  process.exit(0);
});
