import { query } from "../config/database.js";

/**
 * Get all shipments for the logged-in distributor with existing QR code from drugbatch
 */
export async function getDistributorShipments(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get distributor info and company/facility
    const distributorResult = await query(
      `SELECT d.id AS distributor_id, dc.id AS company_id, dc.facility, dc.name AS company_name,
              dc.name || ' - ' || dc.facility AS full_facility_name
       FROM distributor d
       JOIN distributor_company dc ON d.companyid = dc.id
       WHERE d.userid = $1`,
      [userId]
    );

    if (!distributorResult.rows.length)
      return res.status(404).json({ message: "Distributor not found" });

    const distributor = distributorResult.rows[0];

    // Fetch shipments relevant to this distributor's company AND facility
    const shipmentsResult = await query(
      `SELECT s.*,
              db.batchnumber,
              db.qrcode AS batch_qrcode,
              d.name AS drugname,
              mc.name AS manufacturername,
              dc.name AS distributorname
       FROM shipment s
       LEFT JOIN drugbatch db ON s.batch_id = db.id
       LEFT JOIN drug d ON s.drug_id = d.id
       LEFT JOIN manufacturer m ON s.manufacturer_id = m.id
       LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
       LEFT JOIN distributor dist ON s.distributor_id = dist.id
       LEFT JOIN distributor_company dc ON dist.companyid = dc.id
       WHERE s.origin_facility = $1
       ORDER BY s.created_at DESC`,
      [distributor.full_facility_name]  // Use the combined company - facility name
    );

    const shipments = shipmentsResult.rows.map((s) => ({
      ...s,
      quantity_shipped: s.quantity_shipped || "N/A",
      temperature: s.temperature || "N/A",
      arrival_date: s.arrival_date || "N/A",
      received_condition: s.received_condition || "N/A",
      destination_facility: s.destination_facility || "N/A",
      route: s.route || "N/A",
      vehicle_number: s.vehicle_number || "N/A",
      status: s.status || "N/A",
      qrCode: s.batch_qrcode, // <-- use existing QR code from drugbatch
    }));

    // Statistics for dashboard
    const stats = {
      total: shipments.length,
      assigned: shipments.filter((s) => s.distributor_id === distributor.distributor_id)
        .length,
      unassigned: shipments.filter((s) => !s.distributor_id).length,
      inTransit: shipments.filter((s) => s.status?.toLowerCase() === "in transit")
        .length,
      pending: shipments.filter((s) => s.status?.toLowerCase() === "pending").length,
      delivered: shipments.filter((s) => s.status?.toLowerCase() === "delivered")
        .length,
    };

    res.json({ 
      shipments, 
      stats,
      distributorContext: {
        company: distributor.company_name,
        facility: distributor.facility,
        fullFacilityName: distributor.full_facility_name
      }
    });
  } catch (error) {
    console.error("Error fetching distributor shipments:", error);
    res.status(500).json({ message: "Error fetching distributor shipments" });
  }
}

/**
 * Get a single distributor shipment by ID with proper authorization
 */
export async function getDistributorShipmentById(req, res, next) {
  try {
    const shipmentId = Number(req.params.id);
    if (isNaN(shipmentId)) return res.status(400).json({ message: "Invalid shipment ID" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // First get distributor context to verify authorization
    const distributorResult = await query(
      `SELECT dc.name || ' - ' || dc.facility AS full_facility_name
       FROM distributor d
       JOIN distributor_company dc ON d.companyid = dc.id
       WHERE d.userid = $1`,
      [userId]
    );

    if (!distributorResult.rows.length)
      return res.status(404).json({ message: "Distributor not found" });

    const distributorFacility = distributorResult.rows[0].full_facility_name;

    // Get shipment only if it belongs to the distributor's facility
    const shipmentResult = await query(
      `SELECT s.*,
              db.batchnumber,
              db.qrcode AS batch_qrcode,
              d.name AS drugname,
              mc.name AS manufacturername,
              dc.name AS distributorname
       FROM shipment s
       LEFT JOIN drugbatch db ON s.batch_id = db.id
       LEFT JOIN drug d ON s.drug_id = d.id
       LEFT JOIN manufacturer m ON s.manufacturer_id = m.id
       LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
       LEFT JOIN distributor dist ON s.distributor_id = dist.id
       LEFT JOIN distributor_company dc ON dist.companyid = dc.id
       WHERE s.id = $1 AND s.origin_facility = $2`,
      [shipmentId, distributorFacility]
    );

    if (!shipmentResult.rows.length)
      return res.status(404).json({ message: "Shipment not found or access denied" });

    const shipment = shipmentResult.rows[0];

    res.json({
      ...shipment,
      quantity_shipped: shipment.quantity_shipped || "N/A",
      temperature: shipment.temperature || "N/A",
      arrival_date: shipment.arrival_date || "N/A",
      received_condition: shipment.received_condition || "N/A",
      destination_facility: shipment.destination_facility || "N/A",
      route: shipment.route || "N/A",
      vehicle_number: shipment.vehicle_number || "N/A",
      status: shipment.status || "N/A",
      qrCode: shipment.batch_qrcode, // existing QR code from drugbatch
    });
  } catch (error) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({ message: "Error fetching shipment" });
  }
}

/**
 * Claim a shipment (assign distributor if unassigned) with facility validation
 */
export async function claimShipment(req, res, next) {
  try {
    const shipmentId = Number(req.params.id);
    if (isNaN(shipmentId)) return res.status(400).json({ message: "Invalid shipment ID" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get distributor context
    const distributorResult = await query(
      `SELECT d.id AS distributor_id, dc.name || ' - ' || dc.facility AS full_facility_name
       FROM distributor d
       JOIN distributor_company dc ON d.companyid = dc.id
       WHERE d.userid = $1`,
      [userId]
    );

    if (!distributorResult.rows.length)
      return res.status(404).json({ message: "Distributor not found" });

    const distributor = distributorResult.rows[0];

    // Assign distributor only if shipment belongs to their facility AND is unassigned
    const updated = await query(
      `UPDATE shipment 
       SET distributor_id = $1 
       WHERE id = $2 
         AND distributor_id IS NULL 
         AND origin_facility = $3
       RETURNING *`,
      [distributor.distributor_id, shipmentId, distributor.full_facility_name]
    );

    if (!updated.rows.length) {
      // Check why it failed
      const shipmentCheck = await query(
        `SELECT distributor_id, origin_facility FROM shipment WHERE id = $1`,
        [shipmentId]
      );
      
      if (!shipmentCheck.rows.length) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      
      const shipment = shipmentCheck.rows[0];
      if (shipment.distributor_id) {
        return res.status(400).json({ message: "Shipment already claimed" });
      }
      if (shipment.origin_facility !== distributor.full_facility_name) {
        return res.status(403).json({ message: "Not authorized to claim this shipment" });
      }
      
      return res.status(400).json({ message: "Cannot claim shipment" });
    }

    const shipment = updated.rows[0];

    // Use existing QR code from drugbatch
    const batchResult = await query(`SELECT qrcode FROM drugbatch WHERE id=$1`, [
      shipment.batch_id,
    ]);
    const qrCode = batchResult.rows[0]?.qrcode || null;

    res.json({ message: "Shipment claimed successfully", data: { ...shipment, qrCode } });
  } catch (error) {
    console.error("Error claiming shipment:", error);
    res.status(500).json({ message: "Error claiming shipment" });
  }
}

/**
 * Update distributor shipment with facility validation
 */
export async function updateDistributorShipment(req, res, next) {
  try {
    const shipmentId = Number(req.params.id);
    if (isNaN(shipmentId)) return res.status(400).json({ message: "Invalid shipment ID" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0)
      return res.status(400).json({ message: "No fields to update" });

    // Get distributor context for authorization
    const distributorResult = await query(
      `SELECT d.id AS distributor_id, dc.name || ' - ' || dc.facility AS full_facility_name
       FROM distributor d
       JOIN distributor_company dc ON d.companyid = dc.id
       WHERE d.userid = $1`,
      [userId]
    );

    if (!distributorResult.rows.length)
      return res.status(404).json({ message: "Distributor not found" });

    const distributor = distributorResult.rows[0];

    // Only allow update if shipment belongs to distributor's facility AND (unassigned or assigned to them)
    const checkShipment = await query(
      `SELECT * FROM shipment 
       WHERE id = $1 
         AND origin_facility = $2
         AND (distributor_id IS NULL OR distributor_id = $3)`,
      [shipmentId, distributor.full_facility_name, distributor.distributor_id]
    );
    
    if (!checkShipment.rows.length)
      return res.status(403).json({ message: "Not authorized to update this shipment" });

    // Assign distributor if unassigned
    if (!checkShipment.rows[0].distributor_id) {
      updates.distributor_id = distributor.distributor_id;
    }

    const fields = Object.keys(updates)
      .map((key, i) => `${key}=$${i + 1}`)
      .join(", ");
    const values = Object.values(updates);
    values.push(shipmentId);

    const updatedShipment = await query(
      `UPDATE shipment SET ${fields}, updated_at=NOW() WHERE id=$${values.length} RETURNING *`,
      values
    );

    const shipment = updatedShipment.rows[0];

    // Get QR code from drugbatch
    const batchResult = await query(`SELECT qrcode FROM drugbatch WHERE id=$1`, [
      shipment.batch_id,
    ]);
    const qrCode = batchResult.rows[0]?.qrcode || null;

    res.json({ message: "Shipment updated successfully", data: { ...shipment, qrCode } });
  } catch (error) {
    console.error("Error updating shipment:", error);
    res.status(500).json({ message: "Error updating shipment" });
  }
}

/**
 * Distributor shipment statistics (for dashboard) with proper facility filtering
 */
export async function getDistributorShipmentStatistics(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const distributorResult = await query(
      `SELECT d.id AS distributor_id, dc.name || ' - ' || dc.facility AS full_facility_name
       FROM distributor d
       JOIN distributor_company dc ON d.companyid = dc.id
       WHERE d.userid = $1`,
      [userId]
    );

    if (!distributorResult.rows.length)
      return res.status(404).json({ message: "Distributor not found" });

    const distributor = distributorResult.rows[0];

    const shipmentsResult = await query(
      `SELECT status, distributor_id FROM shipment WHERE origin_facility = $1`,
      [distributor.full_facility_name]
    );

    const shipments = shipmentsResult.rows;

    const stats = {
      total: shipments.length,
      assigned: shipments.filter((s) => s.distributor_id).length,
      unassigned: shipments.filter((s) => !s.distributor_id).length,
      inTransit: shipments.filter((s) => s.status?.toLowerCase() === "in transit").length,
      pending: shipments.filter((s) => s.status?.toLowerCase() === "pending").length,
      delivered: shipments.filter((s) => s.status?.toLowerCase() === "delivered").length,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching distributor shipment statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
}