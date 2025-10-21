import { prisma } from "../config/database.js";
import { ipfs } from "../config/ipfs.js";

async function createDrugBatch(data) {
  // data includes drugId, batchNumber, manufactureDate, expiryDate, optional image data
  let ipfsImageHash = null;
  if (data.imageBase64) {
    const buffer = Buffer.from(data.imageBase64, "base64");
    const { path } = await ipfs.add(buffer);
    ipfsImageHash = path;
  }

  return prisma.drugBatch.create({
    data: {
      drugId: data.drugId,
      batchNumber: data.batchNumber,
      manufactureDate: new Date(data.manufactureDate),
      expiryDate: new Date(data.expiryDate),
      ipfsImageHash,
      createdAt: new Date(),
    },
  });
}

async function getDrugBatchById(id) {
  return prisma.drugBatch.findUnique({ where: { id } });
}

async function updateDrugBatch(id, updateData) {
  if (updateData.imageBase64) {
    const buffer = Buffer.from(updateData.imageBase64, "base64");
    const { path } = await ipfs.add(buffer);
    updateData.ipfsImageHash = path;
    delete updateData.imageBase64;
  }
  if (updateData.manufactureDate) updateData.manufactureDate = new Date(updateData.manufactureDate);
  if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
  return prisma.drugBatch.update({ where: { id }, data: updateData });
}

async function deleteDrugBatch(id) {
  await prisma.drugBatch.delete({ where: { id } });
}

export { createDrugBatch, getDrugBatchById, updateDrugBatch, deleteDrugBatch };
