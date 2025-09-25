import prisma from "../config/database.js";
import blockchainService from "../services/blockchainService.js";
import auditLogService from "../services/auditLogService.js";

export async function getAuditLogs(req, res, next) {
  try {
    const { userId, actionType, targetId, startDate, endDate } = req.query;

    const filterParams = {
      userId: userId ? Number(userId) : undefined,
      actionType,
      targetId: targetId ? Number(targetId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const logs = await auditLogService.fetchLogs(filterParams);

    res.json(logs);
  } catch (error) {
    next(error);
  }
}

export async function monitorSupplyChain(req, res, next) {
  try {
    // Aggregate batch and transfer status data
    const batchCount = await prisma.batch.count();
    const transferCount = await prisma.transfer.count();
    const pendingTransfers = await prisma.transfer.count({ where: { status: "INITIATED" } });

    res.json({
      batchCount,
      transferCount,
      pendingTransfers,
    });
  } catch (error) {
    next(error);
  }
}

export async function enforceCompliance(req, res, next) {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!["BATCH", "USER"].includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType" });
    }

    if (!targetId) {
      return res.status(400).json({ error: "targetId required" });
    }

    // Mark as non-compliant in DB (example: add complianceFlag or similar)
    if (targetType === "BATCH") {
      await prisma.batch.update({
        where: { id: Number(targetId) },
        data: { complianceFlag: "NON_COMPLIANT" },
      });
    } else if (targetType === "USER") {
      await prisma.user.update({
        where: { id: Number(targetId) },
        data: { complianceFlag: "NON_COMPLIANT" },
      });
    }

    // Log action
    await auditLogService.logAction(req.user.id, "ENFORCE_COMPLIANCE", targetId, reason || "");

    res.json({ message: "Compliance enforced" });
  } catch (error) {
    next(error);
  }
}

export async function revokeAccess(req, res, next) {
  try {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // Revoke blockchain permissions
    await blockchainService.revokeAccessOnChain(userId);

    // Update DB (optional)
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { accessRevoked: true },
    });

    // Log action
    await auditLogService.logAction(req.user.id, "REVOKE_ACCESS", userId, reason || "");

    res.json({ message: "Access revoked" });
  } catch (error) {
    next(error);
  }
}
