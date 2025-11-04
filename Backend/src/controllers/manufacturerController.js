// Delete shipment
async function deleteManufacturerShipment(req, res, next) {
  try {
    const userId = req.user.id;
    const shipmentId = req.params.id;
    // Get manufacturer id
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) return res.status(404).json({ message: "Manufacturer not found" });
    const manufacturerId = manufacturerResult.rows[0].id;
    const deleted = await manufacturerService.deleteManufacturerShipment(manufacturerId, shipmentId);
    res.json({ success: deleted });
  } catch (error) {
    console.error("Error in deleteManufacturerShipment:", error);
    res.status(500).json({ message: "Failed to delete shipment" });
  }
}
// Update batch info
async function updateManufacturerBatch(req, res, next) {
  try {
    const userId = req.user.id;
    const batchId = req.params.id;
    const updateData = req.body;
    // Get manufacturer id
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) return res.status(404).json({ message: "Manufacturer not found" });
    const manufacturerId = manufacturerResult.rows[0].id;
    const updatedBatch = await manufacturerService.updateManufacturerBatch(manufacturerId, batchId, updateData);
    res.json(updatedBatch);
  } catch (error) {
    console.error("Error in updateManufacturerBatch:", error);
    res.status(500).json({ message: "Failed to update batch" });
  }
}

// Delete batch
async function deleteManufacturerBatch(req, res, next) {
  try {
    const userId = req.user.id;
    const batchId = req.params.id;
    // Get manufacturer id
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) return res.status(404).json({ message: "Manufacturer not found" });
    const manufacturerId = manufacturerResult.rows[0].id;
    const deleted = await manufacturerService.deleteManufacturerBatch(manufacturerId, batchId);
    res.json({ success: deleted });
  } catch (error) {
    console.error("Error in deleteManufacturerBatch:", error);
    res.status(500).json({ message: "Failed to delete batch" });
  }
}
import { query } from "../config/database.js";
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import * as manufacturerService from "../services/manufacturerService.js";

// Dropdowns for batch registration form - UPDATED WITH ERROR HANDLING
async function getManufacturerDropdowns(req, res, next) {
  try {
    console.log('Fetching dropdown data for user:', req.user.id);
    
    const [drugs, qualityOfficers, distributors] = await Promise.all([
      query("SELECT id, name FROM drug ORDER BY name ASC"),
      query("SELECT id, fullname FROM staff WHERE role = 'Quality Control Officer' ORDER BY fullname ASC"),
      query(`
        SELECT 
          id, name, facility, facility_address, facility_phone, facility_location,
          name || ' - ' || facility AS display_name
        FROM distributor_company
        ORDER BY name, facility ASC
      `)
    ]);

    console.log('Dropdown results:', {
      drugs: drugs.rows.length,
      qualityOfficers: qualityOfficers.rows.length,
      distributors: distributors.rows.length
    });

    // If no drugs in DB, inject static test data
    let drugsList = drugs.rows;
    if (!drugsList || drugsList.length === 0) {
      drugsList = [
        { id: 1, name: 'Paracetamol' },
        { id: 2, name: 'Amoxicillin' },
        { id: 3, name: 'Ibuprofen' },
        { id: 4, name: 'Metformin' }
      ];
    }
    const response = {
      drugs: drugsList,
      qualityOfficers: qualityOfficers.rows,
      distributors: distributors.rows.map(d => ({
        id: d.id,
        display_name: d.display_name,
        facility_address: d.facility_address,
        facility_phone: d.facility_phone,
        facility_location: d.facility_location
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getManufacturerDropdowns:', error);
    // Return empty arrays instead of failing completely
    res.json({
      drugs: [],
      qualityOfficers: [],
      distributors: []
    });
  }
}

// Create Drug Batch (top-level) - UPDATED WITH FIXED DISTRIBUTOR QUERY
async function createDrugBatch(req, res, next) {
  try {
    const userId = req.user.id;
    // Get manufacturer id and company info
    const manufacturerResult = await query("SELECT id, companyid FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const companyId = manufacturerResult.rows[0].companyid;

    // Get facility info
    const companyResult = await query("SELECT facility, name FROM manufacturer_company WHERE id = $1", [companyId]);
    const manufacturingFacility = companyResult.rows[0]?.facility || "";
    const manufacturerCompanyName = companyResult.rows[0]?.name || "";

    // Form fields
    const { drugid, quantity, manufacturedate, expirydate, storagetemperature, distributorcompanyid, distributor_facility_id } = req.body;

    // Get drug details
    const drugResult = await query("SELECT name, code, formulation, dosageunit FROM drug WHERE id = $1", [drugid]);
    if (!drugResult.rows.length) {
      return res.status(400).json({ message: "Drug not found." });
    }
    const drug = drugResult.rows[0];

    // Get distributor company and facility details - FIXED QUERY
    let distributorCompany = null;
    if (distributorcompanyid) {
      const distResult = await query(
        `SELECT id, name, facility, facility_address, facility_phone, facility_location 
         FROM distributor_company WHERE id = $1`,
        [distributorcompanyid]
      );
      distributorCompany = distResult.rows[0] || null;
    }

    // Generate batchnumber, blockchain tx, QR code
    const batchnumber = uuidv4().slice(0, 8).toUpperCase();
    const blockchaintx = uuidv4().replace(/-/g, "");
    const qrData = {
      manufacturer: manufacturerCompanyName,
      drug: drug.name,
      batchnumber,
      manufacturedate
    };
    // ...existing QR code logic...
    // Insert batch into DB
    const insertResult = await query(`
      INSERT INTO drugbatch (
        manufacturerid, drugid, batchnumber, manufacturedate, expirydate, blockchaintx, qrcode, quantity, storagetemperature, manufacturingfacility, distributorcompanyid, distributor_facility_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, batchnumber, qrcode, blockchaintx
    `, [manufacturerId, drugid, batchnumber, manufacturedate, expirydate, blockchaintx, qrcode, quantity, storagetemperature, manufacturingFacility, distributorcompanyid || null, distributor_facility_id || null]);

    return res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error in createDrugBatch:', error);
    next(error);
  }
}

// Manufacturer Shipments
async function getManufacturerShipments(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const shipments = await manufacturerService.getManufacturerShipments(manufacturerId);
    res.json(shipments);
  } catch (error) {
    next(error);
  }
}

async function getManufacturerShipmentDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const shipmentId = req.params.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const shipment = await manufacturerService.getManufacturerShipmentDetails(manufacturerId, shipmentId);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    res.json(shipment);
  } catch (error) {
    next(error);
  }
}

async function createManufacturerShipment(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const shipment = await manufacturerService.createManufacturerShipment(manufacturerId, req.body);
    res.status(201).json(shipment);
  } catch (error) {
    next(error);
  }
}

async function updateManufacturerShipmentStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const shipmentId = req.params.id;
    const { status } = req.body;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    await manufacturerService.updateManufacturerShipmentStatus(manufacturerId, shipmentId, status);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function getManufacturerAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const analytics = await manufacturerService.getManufacturerAnalytics(manufacturerId);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

// Get blockchain transactions for manufacturer
async function getManufacturerBlockchain(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const { batchnumber, blockchaintx } = req.query;
    let filterSql = "";
    let params = [manufacturerId];
    let paramIdx = 2;
    if (batchnumber) { filterSql += ` AND db.batchnumber = $${paramIdx}`; params.push(batchnumber); paramIdx++; }
    if (blockchaintx) { filterSql += ` AND db.blockchaintx = $${paramIdx}`; params.push(blockchaintx); paramIdx++; }
    const sql = `
      SELECT db.batchnumber, db.blockchaintx, db.status, db.manufacturedate, db.expirydate, db.qrcode,
        ev.timestamp, ev.verified, ev.event_type, ev.block_number, ev.entityid, ev.tx_hash
      FROM drugbatch db
      LEFT JOIN blockchaineventlog ev ON ev.entityid = db.id
      WHERE db.manufacturerid = $1 AND db.blockchaintx IS NOT NULL ${filterSql}
      ORDER BY ev.timestamp DESC NULLS LAST, db.id DESC
    `;
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Get blockchain tx details
async function getManufacturerBlockchainTx(req, res, next) {
  try {
    const userId = req.user.id;
    const tx = req.params.tx;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const sql = `
      SELECT db.batchnumber, db.blockchaintx, db.status, db.manufacturedate, db.expirydate, db.qrcode,
        ev.timestamp, ev.verified, ev.event_type, ev.block_number, ev.entityid, ev.tx_hash,
        s.shipmentnumber, s.status AS shipment_status, s.departure_date, s.arrival_date
      FROM drugbatch db
      LEFT JOIN blockchaineventlog ev ON ev.entityid = db.id AND ev.tx_hash = $2
      LEFT JOIN shipment s ON s.batch_id = db.id
      WHERE db.manufacturerid = $1 AND db.blockchaintx = $2
      LIMIT 1
    `;
    const { rows } = await query(sql, [manufacturerId, tx]);
    if (rows.length === 0) return res.status(404).json({ message: "Transaction not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Get all batches for manufacturer with filters
async function getManufacturerBatches(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;

    // Filters
    const { status, drugid, manufacturedate, expirydate } = req.query;
    let filterSql = "";
    let params = [manufacturerId];
    let paramIdx = 2;
    if (status) { filterSql += ` AND db.status = $${paramIdx}`; params.push(status); paramIdx++; }
    if (drugid) { filterSql += ` AND db.drugid = $${paramIdx}`; params.push(drugid); paramIdx++; }
    if (manufacturedate) { filterSql += ` AND db.manufacturedate >= $${paramIdx}`; params.push(manufacturedate); paramIdx++; }
    if (expirydate) { filterSql += ` AND db.expirydate <= $${paramIdx}`; params.push(expirydate); paramIdx++; }

    const sql = `
      SELECT db.id, db.batchnumber, d.name AS drugname, db.quantity, db.manufacturedate, db.expirydate, db.status, db.blockchaintx, db.qrcode,
        s.shipmentnumber, db.manufacturingfacility
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      LEFT JOIN shipment s ON s.batch_id = db.id
      WHERE db.manufacturerid = $1 ${filterSql}
      ORDER BY db.id DESC
    `;
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Get full batch details
async function getManufacturerBatchDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const batchId = req.params.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const sql = `
      SELECT db.*, d.name AS drugname, s.shipmentnumber, mc.name AS facility_name, mc.facility_address, mc.facility_phone, mc.facility_location,
        u.full_name AS quality_officer, db.blockchaintx, db.qrcode
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      LEFT JOIN shipment s ON s.batch_id = db.id
      LEFT JOIN manufacturer_company mc ON mc.id = db.manufacturerid
      LEFT JOIN staff u ON u.id = db.qualitycontrolofficerid
      WHERE db.id = $1 AND db.manufacturerid = $2
    `;
    const { rows } = await query(sql, [batchId, manufacturerId]);
    if (rows.length === 0) return res.status(404).json({ message: "Batch not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Manufacturer Dashboard
async function getManufacturerDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    // Get manufacturer table id from userId
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;

    // Summary cards
    const totalBatchesResult = await query("SELECT COUNT(*) AS total FROM drugbatch WHERE manufacturerid = $1", [manufacturerId]);
    const pendingQCResult = await query("SELECT COUNT(*) AS pending FROM drugbatch WHERE manufacturerid = $1 AND status = 'Pending'", [manufacturerId]);
    const activeShipmentsResult = await query("SELECT COUNT(*) AS active FROM shipment WHERE manufacturer_id = $1 AND status = 'In Transit'", [manufacturerId]);
    const deliveredShipmentsResult = await query("SELECT COUNT(*) AS delivered FROM shipment WHERE manufacturer_id = $1 AND status = 'Delivered'", [manufacturerId]);

    // Recent batches (last 5)
    const recentBatchesResult = await query(`
      SELECT db.batchnumber, d.name AS drug, db.quantity, db.expirydate, db.status, db.blockchaintx
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      WHERE db.manufacturerid = $1
      ORDER BY db.id DESC
      LIMIT 5
    `, [manufacturerId]);

    // Recent shipments (last 5)
    const recentShipmentsResult = await query(`
      SELECT s.shipmentnumber, db.batchnumber, dc.name AS distributor, s.status, s.departure_date
      FROM shipment s
      JOIN drugbatch db ON db.id = s.batch_id
      LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
      WHERE s.manufacturer_id = $1
      ORDER BY s.id DESC
      LIMIT 5
    `, [manufacturerId]);

    // Blockchain snapshot (last 5 verified)
    const blockchainSnapshotResult = await query(`
      SELECT batchnumber, blockchaintx, status
      FROM drugbatch
      WHERE manufacturerid = $1 AND blockchaintx IS NOT NULL
      ORDER BY id DESC
      LIMIT 5
    `, [manufacturerId]);

    return res.json({
      summary: {
        totalBatches: Number(totalBatchesResult.rows[0]?.total ?? 0),
        pendingQualityChecks: Number(pendingQCResult.rows[0]?.pending ?? 0),
        activeShipments: Number(activeShipmentsResult.rows[0]?.active ?? 0),
        deliveredShipments: Number(deliveredShipmentsResult.rows[0]?.delivered ?? 0),
      },
      recentBatches: recentBatchesResult.rows,
      recentShipments: recentShipmentsResult.rows,
      blockchainSnapshot: blockchainSnapshotResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function getManufacturerProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await manufacturerService.getManufacturerByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Manufacturer profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateManufacturerProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await manufacturerService.updateManufacturerByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Manufacturer profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

export {
  getManufacturerProfile, 
  updateManufacturerProfile, 
  getManufacturerDashboard, 
  createDrugBatch, 
  getManufacturerBatches, 
  getManufacturerBatchDetails, 
  updateManufacturerBatch,
  deleteManufacturerBatch,
  getManufacturerBlockchain, 
  getManufacturerBlockchainTx, 
  getManufacturerAnalytics, 
  getManufacturerShipments, 
  getManufacturerShipmentDetails, 
  createManufacturerShipment, 
  updateManufacturerShipmentStatus, 
  deleteManufacturerShipment,
  getManufacturerDropdowns 
};