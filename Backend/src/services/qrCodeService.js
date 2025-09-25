import QRCode from "qrcode";

export async function generatePrescriptionQRCode(data) {
  const payload = JSON.stringify(data);
  return QRCode.toDataURL(payload);
}

export async function generateBatchQRCode(data) {
  const payload = JSON.stringify(data);
  return QRCode.toDataURL(payload);
}
