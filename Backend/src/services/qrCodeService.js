import { prisma } from "../config/database.js";
import { generateQrCodeDataUrl } from "../utils/qrCodeGenerator.js";

async function generateAndStoreQrCode(userId, data) {
  const imageUrl = await generateQrCodeDataUrl(data);
  const qrCode = await prisma.qRCode.create({
    data: {
      userId,
      data,
      imageUrl,
      createdAt: new Date(),
    },
  });
  return qrCode;
}

async function getQrCodeById(id) {
  return prisma.qRCode.findUnique({ where: { id } });
}

export { generateAndStoreQrCode, getQrCodeById };
