import { query } from "../config/database.js";
import QRCode from 'qrcode';
import * as manufacturerService from "../services/manufacturerService.js";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dropdowns for shipment creation form
async function getShipmentFormDropdowns(req, res, next) {
  try {
    // Get all batches (id, batchnumber, drugname)
    const batchesResult = await query(`
      SELECT db.id, db.batchnumber, d.name AS drugname
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      WHERE db.is_deleted = false OR db.is_deleted IS NULL
      ORDER BY db.id DESC
    `);

    // Get all distributors (id, name, display_name)
    const distributorsResult = await query(`
      SELECT dc.id, dc.name, (dc.name || ' - ' || f.location) AS display_name
      FROM distributor_company dc
      JOIN facility f ON dc.facility_id = f.id
      ORDER BY dc.name ASC
    `);

    // Get all facilities (id, distributor_id, facility_name, facility_location)
    const facilitiesResult = await query(`
      SELECT f.id, dc.id AS distributor_id, f.name AS facility_name, f.location AS facility_location
      FROM distributor_company dc
      JOIN facility f ON dc.facility_id = f.id
      ORDER BY f.name ASC
    `);

    // Get all pharmacy companies (id, name, facility_id)
    const pharmacyCompaniesResult = await query(`
      SELECT pc.id, pc.name, pc.facility_id
      FROM pharmacy_company pc
      ORDER BY pc.name ASC
    `);

    // Get all pharmacy facilities from facility table where type = 'pharmacy'
    const pharmacyFacilitiesResult = await query(`
      SELECT f.id, f.name, f.location, f.address, f.phone
      FROM facility f
      WHERE f.type = 'pharmacy'
      ORDER BY f.name ASC
    `);

    res.json({
      batches: batchesResult.rows,
      distributors: distributorsResult.rows,
      facilities: facilitiesResult.rows,
      pharmacy_companies: pharmacyCompaniesResult.rows,
      pharmacy_facilities: pharmacyFacilitiesResult.rows
    });
  } catch (error) {
    console.error('❌ ERROR in getShipmentFormDropdowns:', error);
    res.status(500).json({
      batches: [],
      distributors: [],
      facilities: [],
      pharmacy_companies: [],
      pharmacy_facilities: [],
      error: 'Failed to fetch shipment dropdown data'
    });
  }
}

// Get all shipments for manufacturer
async function getManufacturerShipments(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    // Get all shipments for this manufacturer
    const shipments = await manufacturerService.getManufacturerShipments(manufacturerId);
    res.json(shipments);
  } catch (error) {
    console.error('❌ Error in getManufacturerShipments:', error);
    res.status(500).json({ message: "Failed to fetch shipments", error: error.message });
  }
}

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

// Dropdowns for batch registration form - CLEAN VERSION (No Fallback Data)
async function getManufacturerDropdowns(req, res, next) {
  console.log(' MANUFACTURER DROPDOWNS ENDPOINT CALLED!');
  
  try {
    // Get drugs from database
    const drugsResult = await query(`
      SELECT id, name, code, formulation, dosageunit 
      FROM drug 
      WHERE is_deleted = false OR is_deleted IS NULL 
      ORDER BY name ASC
    `);
    console.log(' Drugs found:', drugsResult.rows.length);

    // Get distributors from database
    const distributorsResult = await query(`
      SELECT 
        dc.id, 
        dc.name,
        f.id as facility_id,
        f.name as facility_name,
        f.address as facility_address,
        f.phone as facility_phone, 
        f.location as facility_location
      FROM distributor_company dc
      JOIN facility f ON dc.facility_id = f.id
      ORDER BY dc.name ASC
    `);
    console.log(' Distributors found:', distributorsResult.rows.length);

    // Get quality officers from database
    const qualityOfficersResult = await query(`
      SELECT id, fullname 
      FROM staff 
      WHERE role = 'Quality Control Officer' 
      ORDER BY fullname ASC
    `);
    console.log('🔬 Quality officers found:', qualityOfficersResult.rows.length);

    // Format response with real database data
    const response = {
      drugs: drugsResult.rows.map(drug => ({
        id: drug.id,
        name: drug.name,
        code: drug.code,
        formulation: drug.formulation,
        dosageunit: drug.dosageunit,
        display_name: `${drug.name} (${drug.code})`
      })),
      distributors: distributorsResult.rows.map(dist => ({
        id: dist.id,
        name: dist.name,
        facility_id: dist.facility_id,
        facility_name: dist.facility_name,
        facility_address: dist.facility_address,
        facility_phone: dist.facility_phone,
        facility_location: dist.facility_location,
        display_name: `${dist.name} - ${dist.facility_location}`
      })),
      qualityOfficers: qualityOfficersResult.rows.map(officer => ({
        id: officer.id,
        fullname: officer.fullname
      }))
    };

    console.log('✅ FINAL RESPONSE from database:', {
      drugs: response.drugs.length,
      distributors: response.distributors.length, 
      qualityOfficers: response.qualityOfficers.length
    });

    res.json(response);

  } catch (error) {
    console.error('❌ ERROR in getManufacturerDropdowns:', error);
    
    // Return empty arrays instead of fallback data
    res.status(500).json({
      drugs: [],
      distributors: [],
      qualityOfficers: [],
      error: "Failed to fetch data from database"
    });
  }
}

async function createDrugBatch(req, res, next) {
  try {
    const userId = req.user.id;
    console.log('🚀 Creating drug batch for user:', userId);
    
    // Get manufacturer id and company info
    const manufacturerResult = await query("SELECT id, companyid FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;
    const companyId = manufacturerResult.rows[0].companyid;

    console.log('🏭 Manufacturer ID:', manufacturerId, 'Company ID:', companyId);

    // Get facility info
    const companyResult = await query(`
      SELECT mc.name, f.name as facility_name, f.address as facility_address
      FROM manufacturer_company mc
      JOIN facility f ON mc.facility_id = f.id
      WHERE mc.id = $1
    `, [companyId]);
    
    if (companyResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer company not found" });
    }
    
    const manufacturingFacility = companyResult.rows[0]?.facility_name || "";
    const manufacturerCompanyName = companyResult.rows[0]?.name || "";

    console.log('🏢 Manufacturing facility:', manufacturingFacility);
    console.log('🏭 Manufacturer company:', manufacturerCompanyName);

    // Form fields - ONLY use distributorcompanyid, not distributor_facility_id
    const { drugid, quantity, manufacturedate, expirydate, storagetemperature, distributorcompanyid, qualitycontrolofficerid } = req.body;

    console.log('📦 Form data:', {
      drugid, quantity, manufacturedate, expirydate, storagetemperature, distributorcompanyid, qualitycontrolofficerid
    });

    // Get drug details
    const drugResult = await query("SELECT name, code, formulation, dosageunit FROM drug WHERE id = $1", [drugid]);
    if (!drugResult.rows.length) {
      return res.status(400).json({ message: "Drug not found." });
    }
    const drug = drugResult.rows[0];
    console.log('💊 Drug details:', drug);

    // Get distributor company details
    let distributorCompany = null;
    if (distributorcompanyid) {
      const distResult = await query(`
        SELECT dc.id, dc.name, f.name as facility_name, f.address as facility_address, 
               f.phone as facility_phone, f.location as facility_location
        FROM distributor_company dc
        JOIN facility f ON dc.facility_id = f.id
        WHERE dc.id = $1
      `, [distributorcompanyid]);
      distributorCompany = distResult.rows[0] || null;
      console.log('🚚 Distributor details:', distributorCompany);
    }

    // Generate batchnumber, blockchain tx
    const batchnumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const blockchaintx = `0x${Buffer.from(`${batchnumber}-${Date.now()}`).toString('hex')}`;
    
    console.log('🔢 Generated batch number:', batchnumber);
    console.log('⛓️ Generated blockchain tx:', blockchaintx);

    // Generate QR code data
    const qrData = {
      manufacturer: manufacturerCompanyName,
      drug: drug.name,
      batchnumber: batchnumber,
      manufacturedate: manufacturedate,
      expirydate: expirydate,
      blockchaintx: blockchaintx,
      quantity: quantity,
      dosage: drug.dosageunit,
      distributor: distributorCompany?.name || 'Not assigned'
    };

    // Generate QR code as file
    console.log('📱 Generating QR code file...');
    let qrcodePath = null;
    
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'qrcodes');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Generate QR code file
      const fileName = `batch-${batchnumber}-${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);
      
      await QRCode.toFile(filePath, JSON.stringify(qrData), {
        width: 300,
        height: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Store relative path for database
      qrcodePath = `/uploads/qrcodes/${fileName}`;
      console.log('✅ QR code file saved:', qrcodePath);
      
    } catch (qrError) {
      console.error('❌ QR code file generation failed:', qrError);
      // Continue without QR code file
    }

    // Insert batch into DB with qrcode_path and qualitycontrolofficerid
    console.log('💾 Inserting batch into database...');
    const insertResult = await query(`
      INSERT INTO drugbatch (
        manufacturerid, drugid, batchnumber, manufacturedate, expirydate, 
        blockchaintx, qrcode_path, quantity, storagetemperature, 
        manufacturingfacility, distributorcompanyid, qualitycontrolofficerid, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
      RETURNING id
    `, [
      manufacturerId, 
      drugid, 
      batchnumber, 
      manufacturedate, 
      expirydate, 
      blockchaintx, 
      qrcodePath,        // Only storing file path now
      quantity, 
      storagetemperature, 
      manufacturingFacility, 
      distributorcompanyid || null,
      qualitycontrolofficerid || null
    ]);

    const batchId = insertResult.rows[0].id;
    console.log('✅ Batch created successfully with ID:', batchId);

    // Fetch full batch details for response
    const detailsSql = `
      SELECT db.id, db.batchnumber, db.quantity, db.manufacturedate, db.expirydate, db.status, db.blockchaintx,
        db.qrcode_path,
        d.name AS drugname,
        db.manufacturingfacility,
        db.storagetemperature,
        db.datechecked,
        s.shipmentnumber AS shipment_number,
        dc.name AS distributorcompany,
        dc.id AS distributorcompanyid,
        f.name AS distributor_facility_name,
        f.address AS distributor_facility_address,
        f.phone AS distributor_facility_phone,
        f.location AS distributor_facility_location,
        st.fullname AS quality_officer,
        mc.name AS manufacturer_company_name,
        mf.name AS manufacturer_facility_name,
        mf.address AS manufacturer_facility_address,
        mf.phone AS manufacturer_facility_phone,
        mf.location AS manufacturer_facility_location
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
      LEFT JOIN facility f ON dc.facility_id = f.id
      LEFT JOIN staff st ON st.id = db.qualitycontrolofficerid
      LEFT JOIN shipment s ON s.batch_id = db.id
      JOIN manufacturer m ON m.id = db.manufacturerid
      JOIN manufacturer_company mc ON mc.id = m.companyid
      JOIN facility mf ON mc.facility_id = mf.id
      WHERE db.id = $1
      LIMIT 1
    `;
    const detailsResult = await query(detailsSql, [batchId]);
    const batchDetails = detailsResult.rows[0];

    // Add QR code info to response
    batchDetails.qrCodeData = qrData;
    batchDetails.qrCodeImageUrl = qrcodePath ? `${req.protocol}://${req.get('host')}${qrcodePath}` : null;

    return res.status(201).json(batchDetails);

  } catch (error) {
    console.error('❌ Error in createDrugBatch:', error);
    res.status(500).json({ 
      message: "Failed to create drug batch",
      error: error.message 
    });
  }
}

// Get batches ready for shipping
async function getBatchesReadyForShipping(req, res, next) {
  try {
    const userId = req.user.id;
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;

    const batchesResult = await query(`
      SELECT 
        db.id,
        db.batchnumber,
        db.manufacturedate,
        db.expirydate,
        db.quantity,
        db.status as batch_status,
        d.name as drug_name,
        d.code as drug_code,
        dc.name as distributor_company_name,
        df.name as destination_facility_name,
        df.location as destination_location,
        -- Check if batch already has active shipment
        EXISTS (
          SELECT 1 FROM shipment s 
          WHERE s.batch_id = db.id AND s.status IN ('pending', 'in_transit')
        ) as has_active_shipment
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      JOIN distributor_company dc ON dc.id = db.distributorcompanyid
      JOIN facility df ON df.id = dc.facility_id
      WHERE db.manufacturerid = $1 
        AND db.status = 'approved'
        AND db.distributorcompanyid IS NOT NULL
      ORDER BY db.manufacturedate DESC
    `, [manufacturerId]);

    res.json({
      success: true,
      batches: batchesResult.rows
    });

  } catch (error) {
    console.error('❌ Error in getBatchesReadyForShipping:', error);
    res.status(500).json({ 
      message: "Failed to fetch batches ready for shipping",
      error: error.message 
    });
  }
}

// Get shipment with full details
async function getManufacturerShipmentDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const shipmentId = req.params.id;
    
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;

    const shipmentResult = await query(`
      SELECT 
        s.*,
        db.batchnumber,
        d.name as drug_name,
        d.code as drug_code,
        -- Origin facility details
        mf.name as origin_facility_name,
        mf.address as origin_address,
        mf.location as origin_location,
        mf.phone as origin_phone,
        -- Destination facility details
        df.name as destination_facility_name,
        df.address as destination_address,
        df.location as destination_location,
        df.phone as destination_phone,
        -- Distributor details
        dc.name as distributor_company_name,
        dist.licenseno as distributor_license
      FROM shipment s
      JOIN drugbatch db ON s.batch_id = db.id
      JOIN drug d ON s.drug_id = d.id
      JOIN facility mf ON s.origin_facility_id = mf.id
      JOIN facility df ON s.destination_facility_id = df.id
      JOIN distributor_company dc ON dc.facility_id = df.id
      LEFT JOIN distributor dist ON dist.companyid = dc.id
      WHERE s.id = $1 AND s.manufacturer_id = $2
    `, [shipmentId, manufacturerId]);

    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.json({
      success: true,
      shipment: shipmentResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Error in getManufacturerShipmentDetails:', error);
    res.status(500).json({ 
      message: "Failed to fetch shipment details",
      error: error.message 
    });
  }
}

// Create Manufacturer Shipment - UPDATED to match frontend
async function createManufacturerShipment(req, res, next) {
  try {
    const userId = req.user.id;
    const { 
      batch_id,           // Changed from batchId
      distributor_company_id, 
      destination_facility_id,
      pharmacy_company_id,
      pharmacy_facility_id,
      quantity_shipped,   // Changed from quantity
      vehicle_number,     // Changed from vehicleNumber
      route, 
      temperature 
    } = req.body;
    
    console.log('🚚 Creating shipment for user:', userId);
    console.log('📦 Shipment data:', req.body);

    // Get manufacturer id
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;

    // Use batch_id instead of batchId
    const batchId = batch_id;

    const batchResult = await query(`
      SELECT 
        db.id as batch_id,
        db.batchnumber,
        db.drugid,
        db.manufacturerid,
        db.quantity,
        db.qrcode_path,
        db.distributorcompanyid,
        -- Origin Facility (Manufacturer)
        mf.id as origin_facility_id,
        mf.name as origin_facility_name,
        mf.address as origin_address,
        mf.location as origin_location,
        mf.phone as origin_phone,
        -- Destination Facility (Distributor)
        df.id as destination_facility_id,
        df.name as destination_facility_name,
        df.address as destination_address,
        df.location as destination_location,
        df.phone as destination_phone,
        -- Drug details
        d.name as drug_name,
        d.code as drug_code,
        -- Distributor details
        dc.name as distributor_company_name,
        dist.id as distributor_id
      FROM drugbatch db
      JOIN manufacturer m ON m.id = db.manufacturerid
      JOIN manufacturer_company mc ON mc.id = m.companyid
      JOIN facility mf ON mf.id = mc.facility_id
      JOIN distributor_company dc ON dc.id = db.distributorcompanyid
      JOIN facility df ON df.id = dc.facility_id
      JOIN drug d ON d.id = db.drugid
      LEFT JOIN distributor dist ON dist.companyid = dc.id
      WHERE db.id = $1 AND db.manufacturerid = $2
    `, [batchId, manufacturerId]);

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ 
        message: "Batch not found or you don't have permission to access this batch" 
      });
    }

    const batch = batchResult.rows[0];
    console.log('🏭 Origin facility:', batch.origin_facility_name);
    console.log('🏢 Destination facility:', batch.destination_facility_name);

    // Check if batch already has an active shipment
    const existingShipmentResult = await query(`
      SELECT id, status 
      FROM shipment 
      WHERE batch_id = $1 AND status IN ('pending', 'in_transit')
    `, [batchId]);

    if (existingShipmentResult.rows.length > 0) {
      return res.status(400).json({ 
        message: "This batch already has an active shipment",
        existingShipment: existingShipmentResult.rows[0] 
      });
    }

    // Use the existing batch QR code file for shipment
    const shipmentQrCodePath = batch.qrcode_path;

    // Create shipment with batch QR code
    console.log('💾 Inserting shipment into database...');
    const shipmentResult = await query(`
      INSERT INTO shipment (
        batch_id, 
        drug_id, 
        manufacturer_id,
        distributor_id,
        quantity_shipped,
        temperature,
        route,
        vehicle_number,
        origin_facility_id,
        destination_facility_id,
        qrcode,
        status,
        departure_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      batch.batch_id,
      batch.drugid,
      batch.manufacturerid,
      batch.distributor_id,
      quantity_shipped || batch.quantity,
      temperature,
      route,
      vehicle_number,
      batch.origin_facility_id,
      batch.destination_facility_id,
      shipmentQrCodePath
    ]);

    const shipment = shipmentResult.rows[0];
    console.log('✅ Shipment created successfully:', shipment.shipmentnumber);

    // Enrich QR code data for shipment (for API response only)
    const shipmentQrData = {
      batchnumber: batch.batchnumber,
      drug: batch.drug_name,
      drug_code: batch.drug_code,
      manufacturer: batch.manufacturer_company_name,
      origin_facility: batch.origin_facility_name,
      origin_location: batch.origin_location,
      distributor: batch.distributor_company_name,
      destination_facility: batch.destination_facility_name,
      destination_location: batch.destination_location,
      quantity_shipped: quantity_shipped || batch.quantity,
      vehicle_number,
      route,
      temperature,
      shipment_type: 'Manufacturer→Distributor→Pharmacist',
      created_at: new Date().toISOString()
    };

    // Return enriched shipment data with facility details and QR code info
    const enrichedShipment = {
      ...shipment,
      batchnumber: batch.batchnumber,
      drug_name: batch.drug_name,
      drug_code: batch.drug_code,
      origin_facility: {
        id: batch.origin_facility_id,
        name: batch.origin_facility_name,
        address: batch.origin_address,
        location: batch.origin_location,
        phone: batch.origin_phone
      },
      destination_facility: {
        id: batch.destination_facility_id,
        name: batch.destination_facility_name,
        address: batch.destination_address,
        location: batch.destination_location,
        phone: batch.destination_phone
      },
      distributor_company: batch.distributor_company_name,
      quantity: quantity_shipped || batch.quantity,
      qrCodeData: shipmentQrData,
      qrCodeImageUrl: shipmentQrCodePath ? `${req.protocol}://${req.get('host')}${shipmentQrCodePath}` : null
    };

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment: enrichedShipment
    });

  } catch (error) {
    console.error('❌ Error in createManufacturerShipment:', error);
    res.status(500).json({ 
      message: "Failed to create shipment",
      error: error.message 
    });
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
    await manufacturerService.updateManufacturerShipmentStatus(manufacturerId, shipmentId, status.toLowerCase());
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function getManufacturerAnalytics(req, res, next) {
  try {
    // Add validation for req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userId = req.user.id;
    console.log('🔍 Fetching analytics for user:', userId);
    
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    
    const manufacturerId = manufacturerResult.rows[0].id;
    console.log('🏭 Manufacturer ID found:', manufacturerId);
    
    const analytics = await manufacturerService.getManufacturerAnalytics(manufacturerId);
    
    console.log('📊 Sending analytics response:', {
      hasData: !!analytics,
      batchesCount: analytics.batchesByMonth?.length || 0,
      shipmentsCount: analytics.shipmentStatus?.length || 0
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('❌ Error in getManufacturerAnalytics controller:', error);
    res.status(500).json({ 
      message: "Failed to fetch analytics",
      error: error.message 
    });
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
      SELECT db.batchnumber, db.blockchaintx, db.status, db.manufacturedate, db.expirydate, db.qrcode_path,
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
      SELECT db.batchnumber, db.blockchaintx, db.status, db.manufacturedate, db.expirydate, db.qrcode_path,
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
      SELECT db.id, db.batchnumber, d.name AS drugname, db.quantity, db.manufacturedate, db.expirydate, db.status, db.blockchaintx, db.qrcode_path,
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
      SELECT db.id, db.batchnumber, db.quantity, db.manufacturedate, db.expirydate, db.status, db.blockchaintx,
        db.qrcode_path,
        d.name AS drugname,
        db.manufacturingfacility,
        db.storagetemperature,
        db.datechecked,
        s.shipmentnumber AS shipment_number,
        dc.name AS distributorcompany,
        dc.id AS distributorcompanyid,
        f.name AS distributor_facility_name,
        f.address AS distributor_facility_address,
        f.phone AS distributor_facility_phone,
        f.location AS distributor_facility_location,
        st.fullname AS quality_officer,
        mc.name AS manufacturer_company_name,
        mf.name AS manufacturer_facility_name,
        mf.address AS manufacturer_facility_address,
        mf.phone AS manufacturer_facility_phone,
        mf.location AS manufacturer_facility_location
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
      LEFT JOIN facility f ON dc.facility_id = f.id
      LEFT JOIN staff st ON st.id = db.qualitycontrolofficerid
      LEFT JOIN shipment s ON s.batch_id = db.id
      JOIN manufacturer m ON m.id = db.manufacturerid
      JOIN manufacturer_company mc ON mc.id = m.companyid
      JOIN facility mf ON mc.facility_id = mf.id
      WHERE db.id = $1 AND db.manufacturerid = $2
      LIMIT 1
    `;
    const { rows } = await query(sql, [batchId, manufacturerId]);
    if (!rows.length) {
      return res.status(404).json({ message: "Batch not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Manufacturer Dashboard - FIXED VERSION
async function getManufacturerDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    // Get manufacturer table id from userId
    const manufacturerResult = await query("SELECT id FROM manufacturer WHERE userid = $1", [userId]);
    if (manufacturerResult.rowCount === 0) {
      return res.status(404).json({ message: "Manufacturer profile not found" });
    }
    const manufacturerId = manufacturerResult.rows[0].id;

    // Summary cards - FIXED: Use correct ENUM values
    const totalBatchesResult = await query("SELECT COUNT(*) AS total FROM drugbatch WHERE manufacturerid = $1", [manufacturerId]);
    const pendingQCResult = await query("SELECT COUNT(*) AS pending FROM drugbatch WHERE manufacturerid = $1 AND status = 'pending'", [manufacturerId]);
    
    // FIXED: Use correct shipment status ENUM values
    const activeShipmentsResult = await query(
      "SELECT COUNT(*) AS active FROM shipment WHERE manufacturer_id = $1 AND status IN ('pending', 'in_transit')", 
      [manufacturerId]
    );
    
    const deliveredShipmentsResult = await query(
      "SELECT COUNT(*) AS delivered FROM shipment WHERE manufacturer_id = $1 AND status = 'delivered'", 
      [manufacturerId]
    );

    // Recent batches (last 5)
    const recentBatchesResult = await query(`
      SELECT db.batchnumber, d.name AS drug, db.quantity, db.expirydate, db.status, db.blockchaintx, db.qrcode_path
      FROM drugbatch db
      JOIN drug d ON d.id = db.drugid
      WHERE db.manufacturerid = $1
      ORDER BY db.id DESC
      LIMIT 5
    `, [manufacturerId]);

    // Recent shipments (last 5) - FIXED: Use correct status values
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
    console.error('❌ Error in getManufacturerDashboard:', error);
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
  getManufacturerDropdowns,
  getBatchesReadyForShipping,
  getShipmentFormDropdowns
};