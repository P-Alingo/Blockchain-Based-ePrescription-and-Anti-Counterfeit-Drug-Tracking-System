import QRCode from "qrcode";

/**
 * Generates a QR code from given text and returns a Base64 image string.
 */
export async function generateQrCode(data) {
  try {
    const qrImage = await QRCode.toDataURL(data, { width: 250 });
    return qrImage;
  } catch (err) {
    console.error("QR generation error:", err);
    throw new Error("Failed to generate QR code");
  }
}
