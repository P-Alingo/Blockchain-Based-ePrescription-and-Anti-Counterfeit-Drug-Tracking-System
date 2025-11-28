// Utility to check and fix shipment mismatches between backend DB/mapping and on-chain contract
// Usage: node src/utils/syncShipmentsOnChain.js


import path from 'path';
import fs from 'fs';
import { getDrugSupplyChainContract } from '../services/blockchainService.js';
import pg from 'pg';
const { Pool } = pg;

// Load shipment_id.json mapping


// Try both possible paths for shipment_id.json
let shipmentMappings = [];
let shipmentMapPath = path.resolve(process.cwd(), 'shipment_id.json');
if (!fs.existsSync(shipmentMapPath)) {
  shipmentMapPath = path.resolve(process.cwd(), 'Backend', 'shipment_id.json');
}
if (fs.existsSync(shipmentMapPath)) {
  try {
    const fileContent = fs.readFileSync(shipmentMapPath, 'utf8');
    shipmentMappings = fileContent ? JSON.parse(fileContent) : [];
    if (!Array.isArray(shipmentMappings)) {
      shipmentMappings = [];
    }
  } catch (err) {
    shipmentMappings = [];
  }
}

// Connect to PostgreSQL

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/eprescribe'
});

async function checkAndFixShipments() {
  const contract = getDrugSupplyChainContract();
  let fixedCount = 0;
  let missingOnChain = [];
  for (const mapping of shipmentMappings) {
    // Support both key names: dbShipmentId/databaseShipmentId, contractShipmentId
    const dbShipmentId = mapping.dbShipmentId || mapping.databaseShipmentId;
    const contractShipmentId = Number(mapping.contractShipmentId);
    try {
      // Query contract for shipment
      const onChainShipment = await contract.shipments(contractShipmentId);
      if (!onChainShipment || !onChainShipment.shipmentId || Number(onChainShipment.shipmentId) !== contractShipmentId) {
        missingOnChain.push(mapping);
      }
    } catch (err) {
      missingOnChain.push(mapping);
    }
  }
  console.log(`Checked ${shipmentMappings.length} shipments.`);
  if (missingOnChain.length === 0) {
    console.log('All shipments exist on-chain.');
  } else {
    console.log(`${missingOnChain.length} shipments missing on-chain:`);
    console.log(missingOnChain);
    // Fix by re-creating on-chain and updating mapping
    for (const mapping of missingOnChain) {
      const dbShipmentId = mapping.dbShipmentId || mapping.databaseShipmentId;
      const res = await pool.query('SELECT * FROM shipment WHERE id = $1', [dbShipmentId]);
      if (res.rows.length === 1) {
        const shipment = res.rows[0];
        // Fetch distributor and pharmacist wallet addresses
        const distributorRes = await pool.query('SELECT wallet_address FROM users WHERE id = $1', [shipment.userid || shipment.distributor_id]);
        const pharmacistRes = await pool.query('SELECT u.wallet_address FROM pharmacist p JOIN users u ON p.userid = u.id WHERE p.id = $1', [shipment.pharmacist_id]);
        const distributorAddress = distributorRes.rows[0]?.wallet_address;
        const pharmacistAddress = pharmacistRes.rows[0]?.wallet_address;
        // Use shipmentNumber or fallback
        const shipmentNumber = shipment.shipmentnumber || `SHIP-${dbShipmentId}`;
        // Use batchId from mapping or shipment
        const batchId = shipment.batch_id;
        // Use status or default
        const status = shipment.status || 'in_transit';
        // Call contract to re-create shipment
        try {
          const { transferBatchOnChain } = await import('../services/blockchainService.js');
          const contractShipmentId = await transferBatchOnChain({
            batchId,
            distributorAddress,
            pharmacistAddress,
            shipmentNumber,
            status,
            shipmentId: dbShipmentId
          });
          console.log(`✅ Re-created shipment on-chain for DB id ${dbShipmentId}, contractShipmentId: ${contractShipmentId}`);
        } catch (err) {
          console.error(`❌ Failed to re-create shipment on-chain for DB id ${dbShipmentId}:`, err);
        }
      } else {
        console.warn(`No shipment found in DB for id ${dbShipmentId}`);
      }
    }
  }
  await pool.end();
}

checkAndFixShipments().catch(console.error);
