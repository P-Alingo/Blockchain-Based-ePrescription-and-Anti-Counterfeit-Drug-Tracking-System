import prisma from "../config/database.js";
import blockchainService from "../services/blockchainService.js";
import ROLES from "../config/roles.js";

export async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        address: true,
        role: true,
        metadata: true,
        twoFactorSecret: false,
        accessRevoked: true,
      },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    res.json({ message: "User role updated", user: updatedUser });
  } catch (error) {
    next(error);
  }
}

export async function viewSystemMetrics(req, res, next) {
  try {
    const userCount = await prisma.user.count();
    const prescriptionCount = await prisma.prescription.count();
    const batchCount = await prisma.batch.count();
    const transferCount = await prisma.transfer.count();

    // Blockchain sync status could be fetched from blockchainService or event listeners
    const blockchainSyncStatus = await blockchainService.getBlockchainSyncStatus();

    res.json({
      userCount,
      prescriptionCount,
      batchCount,
      transferCount,
      blockchainSyncStatus,
    });
  } catch (error) {
    next(error);
  }
}

export async function manageSmartContracts(req, res, next) {
  try {
    const { action, contractName, params } = req.body;
    if (!action || !contractName) {
      return res.status(400).json({ error: "action and contractName are required" });
    }

    // Supported actions: upgrade, pause, unpause, etc.
    let result;
    switch (action) {
      case "upgrade":
        result = await blockchainService.upgradeContract(contractName, params);
        break;
      case "pause":
        result = await blockchainService.pauseContract(contractName);
        break;
      case "unpause":
        result = await blockchainService.unpauseContract(contractName);
        break;
      default:
        return res.status(400).json({ error: "Unsupported action" });
    }

    res.json({ message: `Contract ${action} executed`, result });
  } catch (error) {
    next(error);
  }
}
