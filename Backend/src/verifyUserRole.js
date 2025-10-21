import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Load ABI
  const artifactPath = path.join(
    __dirname,
    "../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json"
  );
  const userManagementArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Setup provider and contract
  const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const contract = new ethers.Contract(
    process.env.USER_MANAGEMENT_ADDRESS,
    userManagementArtifact.abi,
    provider
  );

  // ✅ Replace with wallet address to check
  const addressToCheck = "0x8F220e34d3EdD96d0f9C0Ed0aB724efc0309C606";

  // Call contract
  const role = await contract.getUserRole(addressToCheck);

  console.log("👤 Address:", addressToCheck);
  console.log("🏷️  On-chain role:", role);
}

main().catch(console.error);
