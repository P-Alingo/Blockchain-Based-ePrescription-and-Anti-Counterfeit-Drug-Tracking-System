
import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";

export async function uploadFile(req) {
  // Stub: Save file and return metadata
  return { filename: "uploaded-file.png", url: "/files/uploaded-file.png" };
}

export async function saveQRCodeFile(buffer, filename) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);
  return { filename, url: `/files/${filename}`, path: filePath };
}

export async function getFile(filename) {
  return { path: path.join(process.cwd(), "uploads", filename) };
}

export async function deleteFile(filename) {
  await fs.unlink(path.join(process.cwd(), "uploads", filename));
  return { success: true };
}
