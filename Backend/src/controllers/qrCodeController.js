import * as qrCodeService from "../services/qrCodeService.js";

async function generateQrCode(req, res, next) {
  try {
    const userId = req.user.id;
    const { data } = req.body;
    const qrCodeData = await qrCodeService.generateAndStoreQrCode(userId, data);
    res.status(201).json(qrCodeData);
  } catch (error) {
    next(error);
  }
}

async function getQrCode(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid QR code ID" });
    const qrCode = await qrCodeService.getQrCodeById(id);
    if (!qrCode) return res.status(404).json({ message: "QR code not found" });
    res.json(qrCode);
  } catch (error) {
    next(error);
  }
}

export { generateQrCode, getQrCode };
