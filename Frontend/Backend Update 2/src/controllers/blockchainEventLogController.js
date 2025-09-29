import * as blockchainEventLogService from "../services/blockchainEventLogService.js";

async function listBlockchainEvents(req, res, next) {
  try {
    const events = await blockchainEventLogService.listEvents();
    res.json(events);
  } catch (error) {
    next(error);
  }
}

async function getBlockchainEvent(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });
    const event = await blockchainEventLogService.getEventById(id);
    if (!event) return res.status(404).json({ message: "Blockchain event not found" });
    res.json(event);
  } catch (error) {
    next(error);
  }
}

export { listBlockchainEvents, getBlockchainEvent };
