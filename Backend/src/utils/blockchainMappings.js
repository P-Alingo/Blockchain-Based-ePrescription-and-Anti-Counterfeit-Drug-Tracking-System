import fs from "fs";
import path from "path";

const BATCH_MAP_PATH = path.resolve(process.cwd(), "batch_id_map.json");

function ensureMapFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", { encoding: "utf8" });
  }
}

function readMappings(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return [];
  return raw
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function getContractBatchId(databaseId) {
  if (!databaseId && databaseId !== 0) return null;
  const mappings = readMappings(BATCH_MAP_PATH);
  const match = mappings.find(
    entry => Number(entry.databaseId) === Number(databaseId)
  );
  return match ? match.contractBatchId : null;
}

export function getDatabaseBatchId(contractBatchId) {
  if (!contractBatchId && contractBatchId !== 0) return null;
  const mappings = readMappings(BATCH_MAP_PATH);
  const match = mappings.find(
    entry => Number(entry.contractBatchId) === Number(contractBatchId)
  );
  return match ? match.databaseId : null;
}

export function saveBatchMapping(databaseId, contractBatchId) {
  if (
    databaseId === undefined ||
    databaseId === null ||
    contractBatchId === undefined ||
    contractBatchId === null
  ) {
    return;
  }
  ensureMapFile(BATCH_MAP_PATH);
  const existing = getContractBatchId(databaseId);
  if (existing) {
    return existing;
  }
  const line = JSON.stringify({
    databaseId: Number(databaseId),
    contractBatchId: Number(contractBatchId)
  });
  fs.appendFileSync(BATCH_MAP_PATH, `${line}\n`, { encoding: "utf8" });
  return contractBatchId;
}

