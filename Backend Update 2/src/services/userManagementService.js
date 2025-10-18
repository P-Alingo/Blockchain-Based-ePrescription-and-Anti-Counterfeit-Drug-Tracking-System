// src/services/userManagementService.js
import { query } from "../config/database.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Correct path to Smart Contracts folder
const contractPath = path.resolve(
  __dirname,
  "../../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json"
);

// Check if contract file exists
if (!fs.existsSync(contractPath)) {
  console.error("❌ Contract JSON file not found at:", contractPath);
  process.exit(1);
}

// Read contract JSON file
const UserManagement = JSON.parse(fs.readFileSync(contractPath, "utf8"));

// --- Configure Blockchain Connection ---
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

console.log("🔑 Backend wallet address:", wallet.address);

const contractAddress = process.env.USER_MANAGEMENT_ADDRESS;
const contract = new ethers.Contract(contractAddress, UserManagement.abi, wallet);

// --- Database + Blockchain Integrated Methods ---

// 🔹 Get user by ID + fetch blockchain role
export async function getUserById(id) {
  const result = await query("SELECT * FROM users WHERE id = $1", [id]);
  const user = result.rows[0];
  if (!user) throw new Error("User not found");

  try {
    const role = await contract.getUserRole(user.wallet_address);
    return { ...user, blockchainRole: role };
  } catch (err) {
    console.warn("⚠️ Blockchain fetch failed:", err.message);
    return user;
  }
}

// 🔹 Update user info (sync blockchain if role changes)
export async function updateUser(id, updateData) {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);

  if (fields.length === 0) throw new Error("No update data provided");

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");
  const sql = `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;

  const result = await query(sql, [...values, id]);
  const user = result.rows[0];
  if (!user) throw new Error("User not found");

  // If role was updated, sync blockchain
  if (updateData.role && user.wallet_address) {
    try {
      const tx = await contract.addUser(user.wallet_address, updateData.role);
      await tx.wait();
      console.log(`✅ Updated on-chain role for ${user.wallet_address} to ${updateData.role}`);
    } catch (err) {
      console.error("⚠️ Blockchain role update failed:", err.message);
    }
  }

  return user;
}

// 🔹 Delete user (optional on-chain removal)
export async function deleteUser(id) {
  const result = await query("SELECT * FROM users WHERE id = $1", [id]);
  const user = result.rows[0];
  if (!user) throw new Error("User not found");

  try {
    await query("DELETE FROM users WHERE id = $1", [id]);
    console.log(`✅ Deleted user ${id} from database`);

    // Optional blockchain cleanup
    // await contract.removeUser(user.wallet_address);
    return true;
  } catch (err) {
    console.error("❌ Delete failed:", err.message);
    return false;
  }
}

// 🔹 Fetch user directly from blockchain by wallet address
export async function getUserOnChain(walletAddress) {
  try {
    const role = await contract.getUserRole(walletAddress);
    return { walletAddress, role };
  } catch (err) {
    console.error("⚠️ Failed to fetch on-chain user:", err.message);
    throw new Error("Could not fetch user from blockchain");
  }
}
