import * as revocationService from "../services/revocationService.js";

async function createRevocation(req, res, next) {
  try {
    const data = req.body;
    const created = await revocationService.createRevocation(data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

async function listRevocations(req, res, next) {
  try {
    const revocations = await revocationService.listRevocations();
    res.json(revocations);
  } catch (error) {
    next(error);
  }
}

export { createRevocation, listRevocations };
