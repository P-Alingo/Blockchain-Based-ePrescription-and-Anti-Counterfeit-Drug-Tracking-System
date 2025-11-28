// Utility to clean up mapping files by removing orphaned entries not present in DB
import fs from 'fs';
import path from 'path';
import { query } from '../config/database.js';

const mappingFiles = [
  {
    file: path.resolve(process.cwd(), 'Backend/drugbatch_ids.json'),
    table: 'drugbatch',
    idField: 'dbDrugBatchId',
    dbField: 'id',
  },
  {
    file: path.resolve(process.cwd(), 'Backend/batchrequest_ids.json'),
    table: 'batch_request',
    idField: 'dbBatchRequestId',
    dbField: 'id',
  },
  {
    file: path.resolve(process.cwd(), 'Backend/shipment_id.json'),
    table: 'shipment',
    idField: 'databaseShipmentId',
    dbField: 'id',
  },
  {
    file: path.resolve(process.cwd(), 'Backend/prescription_id_map.json'),
    table: 'prescription',
    idField: 'databaseId',
    dbField: 'id',
  },
];

export async function cleanUpMappings() {
  for (const { file, table, idField, dbField } of mappingFiles) {
    if (!fs.existsSync(file)) continue;
    let mappings;
    try {
      mappings = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`[Mapping Cleanup] Failed to parse ${file}:`, err);
      continue;
    }
    // Get all valid IDs from DB
    let validIds = [];
    try {
      const res = await query(`SELECT ${dbField} FROM ${table}`);
      validIds = res.rows.map(row => String(row[dbField]));
    } catch (err) {
      console.error(`[Mapping Cleanup] DB query failed for ${table}:`, err);
      continue;
    }
    // Filter mappings
    const cleaned = mappings.filter(obj => validIds.includes(String(obj[idField])));
    if (cleaned.length !== mappings.length) {
      fs.writeFileSync(file, JSON.stringify(cleaned, null, 2));
      console.log(`[Mapping Cleanup] Cleaned ${file}: ${mappings.length - cleaned.length} orphaned entries removed.`);
    } else {
      console.log(`[Mapping Cleanup] No orphaned entries found in ${file}.`);
    }
  }
  console.log('[Mapping Cleanup] All mapping files checked.');
}

// Usage: import and call cleanUpMappings() from a script or admin route
