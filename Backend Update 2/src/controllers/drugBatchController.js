import * as drugBatchService from "../services/drugBatchService.js";

async function createDrugBatch(req, res, next) {
  try {
    const data = req.body;
    const created = await drugBatchService.createDrugBatch(data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

async function getDrugBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid drug batch ID" });
    const batch = await drugBatchService.getDrugBatchById(id);
    if (!batch) return res.status(404).json({ message: "Drug batch not found" });
    res.json(batch);
  } catch (error) {
    next(error);
  }
}

async function updateDrugBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid drug batch ID" });
    const updateData = req.body;
    const updated = await drugBatchService.updateDrugBatch(id, updateData);
    if (!updated) return res.status(404).json({ message: "Drug batch not found" });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteDrugBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid drug batch ID" });
    await drugBatchService.deleteDrugBatch(id);
    res.json({ message: "Drug batch deleted" });
  } catch (error) {
    next(error);
  }
}

export { createDrugBatch, getDrugBatch, updateDrugBatch, deleteDrugBatch };
