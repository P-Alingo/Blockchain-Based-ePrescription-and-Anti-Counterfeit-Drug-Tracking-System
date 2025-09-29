import * as supplyChainService from "../services/supplyChainService.js";

async function recordSupplyChainEvent(req, res, next) {
  try {
    const { drugBatchId, fromEntityId, toEntityId, eventType, transactionHash } = req.body;
    const recorded = await supplyChainService.recordEvent({ drugBatchId, fromEntityId, toEntityId, eventType, transactionHash });
    res.status(201).json(recorded);
  } catch (error) {
    next(error);
  }
}

async function listSupplyChainEvents(req, res, next) {
  try {
    const events = await supplyChainService.listEvents();
    res.json(events);
  } catch (error) {
    next(error);
  }
}

export { recordSupplyChainEvent, listSupplyChainEvents };
