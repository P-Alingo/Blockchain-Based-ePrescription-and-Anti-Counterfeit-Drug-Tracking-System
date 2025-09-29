import * as dispenseRecordService from "../services/dispenseRecordService.js";

async function createDispenseRecord(req, res, next) {
  try {
    const data = req.body;
    const created = await dispenseRecordService.createDispenseRecord(data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

async function listDispenseRecords(req, res, next) {
  try {
    const records = await dispenseRecordService.listDispenseRecords();
    res.json(records);
  } catch (error) {
    next(error);
  }
}

export { createDispenseRecord, listDispenseRecords };
