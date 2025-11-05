import QRCode from "qrcode";
import { query } from "../config/database.js";

/**
 * Create a new drug batch with QR code and distributor company/facility
 */
export async function createDrugBatch(req, res, next) {
  try {
    const {
      drugid,
      manufacturedate,
      expirydate,
      quantity,
      storagetemperature,
      manufacturingfacility,
      qualitycontrolofficerid,
      distributorcompanyid,
      datechecked,
      status = "Pending"
    } = req.body;

    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Unauthorized: User not found in token." });

    // Join with manufacturer_company to get company name
    const manufacturerResult = await query(
      `SELECT m.id, mc.name AS companyname 
       FROM manufacturer m 
       JOIN manufacturer_company mc ON m.companyid = mc.id 
       WHERE m.userid = $1`,
      [userId]
    );
    if (!manufacturerResult.rows.length)
      return res.status(400).json({ message: "Manufacturer not found for this user." });

    const manufacturer = manufacturerResult.rows[0];

    if (!drugid || !manufacturedate || !expirydate)
      return res.status(400).json({ message: "Missing required fields." });

    const drugResult = await query(`SELECT name FROM drug WHERE id = $1`, [drugid]);
    if (!drugResult.rows.length)
      return res.status(400).json({ message: "Drug not found." });

    // Verify distributor company/facility
    let distributorCompany = { name: "Not Assigned", facility: "N/A", facility_id: null };
    let distributorFacilityId = null;
    if (distributorcompanyid) {
      const distResult = await query(
        `SELECT dc.name, f.id as facility_id, f.name as facility_name, f.address as facility_address, f.phone as facility_phone, f.location as facility_location
         FROM distributor_company dc
         JOIN facility f ON dc.facility_id = f.id
         WHERE dc.id = $1`,
        [distributorcompanyid]
      );
      if (!distResult.rows.length)
        return res.status(400).json({ message: "Distributor company not found." });

      distributorCompany = distResult.rows[0];
      distributorFacilityId = distResult.rows[0].facility_id;

      // Auto-combine name + facility if manufacturingfacility not provided
      if (!manufacturingfacility || manufacturingfacility.trim() === "") {
        req.body.manufacturingfacility = `${distributorCompany.name} - ${distributorCompany.facility_name}`;
      }
    }

    // Verify quality control officer
    let qualityofficername = "Not Assigned";
    if (qualitycontrolofficerid) {
      const officerResult = await query(
        `SELECT fullname FROM staff WHERE id = $1 AND role = 'Quality Control Officer'`,
        [qualitycontrolofficerid]
      );
      if (!officerResult.rows.length)
        return res.status(400).json({ message: "Quality control officer not found." });
      qualityofficername = officerResult.rows[0].fullname;
    }

    // Insert batch — batchnumber auto-generated
    const insertResult = await query(
      `INSERT INTO drugbatch (
        manufacturerid, drugid, manufacturedate, expirydate,
        quantity, storagetemperature, manufacturingfacility,
        qualitycontrolofficerid, distributorcompanyid, distributor_facility_id, datechecked, status, qrcode
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'') RETURNING *`,
      [
        manufacturer.id,
        drugid,
        manufacturedate,
        expirydate,
        quantity || null,
        storagetemperature || null,
        req.body.manufacturingfacility?.trim() || null,
        qualitycontrolofficerid || null,
        distributorcompanyid || null,
        distributorFacilityId || null,
        datechecked || null,
        status
      ]
    );

    const createdBatch = insertResult.rows[0];
    const drugname = drugResult.rows[0].name;

    // Generate QR code
    const qrData = {
      manufacturer: manufacturer.companyname,
      drug: drugname,
      batchnumber: createdBatch.batchnumber,
      manufacturedate,
      expirydate,
      quantity: quantity || "N/A",
      storagetemperature: storagetemperature || "N/A",
      manufacturingfacility: req.body.manufacturingfacility || "N/A",
      qualityofficer: qualityofficername,
      distributorCompany: distributorCompany.name,
      distributorFacility: distributorCompany.facility,
      status
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
      color: { dark: "#166534", light: "#FFFFFF" }
    });

    await query(`UPDATE drugbatch SET qrcode = $1 WHERE id = $2`, [qrCodeImage, createdBatch.id]);

    // FIXED: Join with shipment table to get shipment number
    const completeBatch = await query(
      `SELECT
        db.id, db.batchnumber, db.manufacturedate, db.expirydate, db.quantity, db.status,
        db.qrcode_path, db.storagetemperature, db.manufacturingfacility, db.datechecked,
        db.blockchaintx, COALESCE(s.shipmentnumber, 'N/A') AS shipment_number,
        db.distributorcompanyid,
        d.name AS drugname, mc.name AS manufacturername,
        mf.name AS manufacturerfacility,
        s2.fullname AS qualityofficer, dc.name AS distributorcompany, dc.facility AS distributorfacility
       FROM drugbatch db
       LEFT JOIN drug d ON db.drugid = d.id
       LEFT JOIN manufacturer m ON db.manufacturerid = m.id
       LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
       LEFT JOIN facility mf ON mc.facility_id = mf.id
       LEFT JOIN staff s2 ON db.qualitycontrolofficerid = s2.id
       LEFT JOIN distributor_company dc ON db.distributorcompanyid = dc.id
       LEFT JOIN shipment s ON db.id = s.batch_id
       WHERE db.id = $1`,
      [createdBatch.id]
    );

    res.status(201).json({
      message: "Drug batch created successfully.",
      data: completeBatch.rows[0]
    });
  } catch (error) {
    console.error("Error creating drug batch:", error);
    next(error);
  }
}

/**
 * Get all drug batches
 */
export async function getAllDrugBatches(req, res, next) {
  try {
    const userId = req.user?.id;
    let whereClause = '';
    let queryParams = [];

    const manufacturerResult = await query(`SELECT id FROM manufacturer WHERE userid = $1`, [userId]);
    if (manufacturerResult.rows.length) {
      whereClause = 'WHERE db.manufacturerid = $1';
      queryParams = [manufacturerResult.rows[0].id];
    }

    // FIXED: Join with shipment table to get shipment number
    let sqlQuery = `
  SELECT db.id, db.batchnumber, db.manufacturedate, db.expirydate, db.quantity, db.status,
  db.qrcode_path, db.storagetemperature, db.manufacturingfacility, db.datechecked, db.blockchaintx,
  COALESCE(s.shipmentnumber, 'N/A') AS shipment_number,
  db.distributorcompanyid,
  d.name AS drugname, mc.name AS manufacturername,
  s2.fullname AS qualityofficer, dc.name AS distributorcompany, dc.facility AS distributorfacility
  FROM drugbatch db
  LEFT JOIN drug d ON db.drugid = d.id
  LEFT JOIN manufacturer m ON db.manufacturerid = m.id
  LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
  LEFT JOIN staff s2 ON db.qualitycontrolofficerid = s2.id
  LEFT JOIN distributor_company dc ON db.distributorcompanyid = dc.id
  LEFT JOIN shipment s ON db.id = s.batch_id
    `;

    if (whereClause) sqlQuery += ` ${whereClause}`;
    sqlQuery += ` ORDER BY db.id DESC`;

    const result = await query(sqlQuery, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching drug batches:", error);
    next(error);
  }
}

/**
 * Get single drug batch by ID
 */
export async function getDrugBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid drug batch ID" });

    // FIXED: Join with shipment table to get shipment number
    const result = await query(
      `SELECT db.id, db.batchnumber, db.manufacturedate, db.expirydate, db.quantity, db.status,
        db.qrcode_path, db.storagetemperature, db.manufacturingfacility, db.datechecked,
        db.blockchaintx, COALESCE(s.shipmentnumber, 'N/A') AS shipment_number,
        db.distributorcompanyid,
        d.name AS drugname, mc.name AS manufacturername,
        s2.fullname AS qualityofficer, dc.name AS distributorcompany, dc.facility AS distributorfacility
       FROM drugbatch db
       LEFT JOIN drug d ON db.drugid = d.id
       LEFT JOIN manufacturer m ON db.manufacturerid = m.id
       LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
       LEFT JOIN staff s2 ON db.qualitycontrolofficerid = s2.id
       LEFT JOIN distributor_company dc ON db.distributorcompanyid = dc.id
       LEFT JOIN shipment s ON db.id = s.batch_id
       WHERE db.id = $1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ message: "Drug batch not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching drug batch:", error);
    next(error);
  }
}

/**
 * Update drug batch
 */
export async function updateDrugBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid drug batch ID" });

    const existingBatch = await query("SELECT id FROM drugbatch WHERE id = $1", [id]);
    if (!existingBatch.rows.length) return res.status(404).json({ message: "Drug batch not found." });

    const allowedFields = [
      "status", "datechecked", "storagetemperature", "manufacturingfacility",
      "drugid", "manufacturedate", "expirydate", "quantity",
      "qualitycontrolofficerid", "distributorcompanyid"
    ];

    const updates = [];
    const values = [];
    let counter = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${counter}`);
        values.push(req.body[field]);
        counter++;
      }
    }

    if (!updates.length) return res.status(400).json({ message: "No valid fields to update." });
    values.push(id);

    await query(`UPDATE drugbatch SET ${updates.join(", ")} WHERE id = $${counter}`, values);

    // FIXED: Join with shipment table to get shipment number
    const updatedBatch = await query(
      `SELECT db.id, db.batchnumber, db.manufacturedate, db.expirydate, db.quantity, db.status,
        db.qrcode_path, db.storagetemperature, db.manufacturingfacility, db.datechecked,
        db.blockchaintx, COALESCE(s.shipmentnumber, 'N/A') AS shipment_number,
        db.distributorcompanyid,
        d.name AS drugname, mc.name AS manufacturername,
        s2.fullname AS qualityofficer, dc.name AS distributorcompany, dc.facility AS distributorfacility
       FROM drugbatch db
       LEFT JOIN drug d ON db.drugid = d.id
       LEFT JOIN manufacturer m ON db.manufacturerid = m.id
       LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
       LEFT JOIN staff s2 ON db.qualitycontrolofficerid = s2.id
       LEFT JOIN distributor_company dc ON db.distributorcompanyid = dc.id
       LEFT JOIN shipment s ON db.id = s.batch_id
       WHERE db.id = $1`,
      [id]
    );

    res.json({ message: "Drug batch updated successfully.", data: updatedBatch.rows[0] });
  } catch (error) {
    console.error("Error updating drug batch:", error);
    next(error);
  }
}

/**
 * Delete drug batch
 */
export async function deleteDrugBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid drug batch ID" });

    const existingBatch = await query("SELECT id FROM drugbatch WHERE id = $1", [id]);
    if (!existingBatch.rows.length) return res.status(404).json({ message: "Drug batch not found." });

    const result = await query("DELETE FROM drugbatch WHERE id = $1 RETURNING id", [id]);
    res.json({ message: "Drug batch deleted successfully.", deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Error deleting drug batch:", error);
    next(error);
  }
}

/**
 * Fetch dropdown data (for forms) — combine distributor name + facility
 */
export async function getDropdownData(req, res, next) {
  try {
    const [drugs, qualityOfficers, distributors] = await Promise.all([
      query("SELECT id, name FROM drug ORDER BY name ASC"),
      query("SELECT id, fullname FROM staff WHERE role = 'Quality Control Officer' ORDER BY fullname ASC"),
      query(`
        SELECT 
          dc.id, 
          dc.name,
          f.id as facility_id,
          f.name as facility_name,
          f.address as facility_address,
          f.phone as facility_phone,
          f.location as facility_location,
          dc.name || ' - ' || f.location AS display_name
        FROM distributor_company dc
        JOIN facility f ON dc.facility_id = f.id
        ORDER BY dc.name ASC
      `)
    ]);

    res.json({
      drugs: drugs.rows,
      qualityOfficers: qualityOfficers.rows,
      distributors: distributors.rows.map(d => ({
        id: d.id,
        name: d.name,
        facility_id: d.facility_id,
        facility_name: d.facility_name,
        facility_address: d.facility_address,
        facility_phone: d.facility_phone,
        facility_location: d.facility_location,
        display_name: d.display_name
      }))
    });
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    next(error);
  }
}

/**
 * Get all batches assigned to Quality Control Officers
 */
export async function getQCBatches(req, res, next) {
  try {
    // FIXED: Join with shipment table to get shipment number
    const result = await query(
      `SELECT db.id, db.batchnumber, db.status, d.name AS drugname,
        mc.name AS manufacturername, s2.fullname AS qualityofficer,
        COALESCE(s.shipmentnumber, 'N/A') AS shipment_number
       FROM drugbatch db
       LEFT JOIN drug d ON db.drugid = d.id
       LEFT JOIN manufacturer m ON db.manufacturerid = m.id
       LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
       LEFT JOIN staff s2 ON db.qualitycontrolofficerid = s2.id
       LEFT JOIN shipment s ON db.id = s.batch_id
       WHERE db.qualitycontrolofficerid IS NOT NULL
       ORDER BY db.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching QC batches:", error);
    next(error);
  }
}

/**
 * Placeholder for batch statistics
 */
export async function getBatchStatistics(req, res, next) {
  try {
    res.json({ message: "Batch statistics endpoint — not yet implemented" });
  } catch (error) {
    console.error("Error fetching batch statistics:", error);
    next(error);
  }
}