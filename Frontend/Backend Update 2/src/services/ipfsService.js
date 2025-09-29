import { ipfs } from "../config/ipfs.js";

async function uploadFile(buffer) {
  const { path } = await ipfs.add(buffer);
  return `https://ipfs.io/ipfs/${path}`;
}

async function uploadJson(jsonObject) {
  const buffer = Buffer.from(JSON.stringify(jsonObject));
  const { path } = await ipfs.add(buffer);
  return `https://ipfs.io/ipfs/${path}`;
}

export { uploadFile, uploadJson };
