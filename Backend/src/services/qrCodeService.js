import { query } from "../config/database.js";
import { generateQrCodeDataUrl } from "../utils/qrCodeGenerator.js";


async function generateAndStoreQrCode(userId, data) {
  const imageUrl = await generateQrCodeDataUrl(data);
  const { rows } = await query(
    "INSERT INTO qrcode (userid, data, imageurl, createdat) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [userId, data, imageUrl]
  );
  return rows[0] || null;
}


async function getQrCodeById(id) {
  const { rows } = await query("SELECT * FROM qrcode WHERE id = $1", [id]);
  return rows[0] || null;
}

export { generateAndStoreQrCode, getQrCodeById };
