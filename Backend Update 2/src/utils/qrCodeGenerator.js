import QRCode from "qrcode";

async function generateQrCodeDataUrl(data) {
  return QRCode.toDataURL(data, { errorCorrectionLevel: "H" });
}

export { generateQrCodeDataUrl };
