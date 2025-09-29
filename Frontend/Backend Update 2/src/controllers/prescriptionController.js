import * as prescriptionService from "../services/prescriptionService.js";

async function createPrescription(req, res, next) {
  try {
    const { patientId, doctorId, data } = req.body; // data could be prescription details
    const userId = req.user.id;
    const result = await prescriptionService.createPrescription(patientId, doctorId, userId, data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getPrescription(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid prescription ID" });
    const prescription = await prescriptionService.getPrescriptionById(id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    res.json(prescription);
  } catch (error) {
    next(error);
  }
}

async function listPrescriptions(req, res, next) {
  try {
    const prescriptions = await prescriptionService.listPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
}

async function deletePrescription(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid prescription ID" });
    await prescriptionService.deletePrescription(id);
    res.json({ message: "Prescription deleted" });
  } catch (error) {
    next(error);
  }
}

export { createPrescription, getPrescription, listPrescriptions, deletePrescription };
