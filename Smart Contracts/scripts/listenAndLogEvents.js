
const hre = require("hardhat");
const { ethers } = hre;
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// =====================
// BOOTSTRAP USER ROLES
// =====================
async function bootstrapUsers(signer, userManagement) {
  // Customize user roles based on UserManagement.sol
  const roles = [
    { name: "doctor", wallets: [/* Add doctor wallet addresses here */] },
    { name: "pharmacist", wallets: [/* Add pharmacist wallet addresses here */] },
    { name: "patient", wallets: [/* Add patient wallet addresses here */] },
    { name: "regulator", wallets: [/* Add regulator wallet addresses here */] },
    { name: "manufacturer", wallets: [/* Add manufacturer wallet addresses here */] },
    { name: "distributor", wallets: [/* Add distributor wallet addresses here */] },
    { name: "admin", wallets: [signer.address] }, // Deployer/admin
  ];

  for (const role of roles) {
    // Get roleId from contract
    let roleId;
    try {
      roleId = await userManagement.getRoleIdByName(role.name);
    } catch (err) {
      // If role doesn't exist, create it
      const tx = await userManagement.connect(signer).createRole(role.name);
      await tx.wait();
      roleId = await userManagement.getRoleIdByName(role.name);
    }
    for (const wallet of role.wallets) {
      // Register user only if not exists
      try {
        const exists = await userManagement.users(wallet);
        if (!exists.exists) {
          const tx = await userManagement.connect(signer).registerUser(wallet, roleId);
          await tx.wait();
          console.log(`✅ Registered ${role.name}: ${wallet}`);
        }
      } catch (err) {
        console.error(`❌ Error registering ${role.name} (${wallet}):`, err.message);
      }
    }
  }
}

async function main() {

  // ✅ Connect to PostgreSQL
  const db = new Client({
    user: "postgres",
    host: "localhost",
    database: "eprescribe_kenya",
    password: "Mkenya04!",
    port: 5432,
  });
  await db.connect();
  console.log("✅ Connected to PostgreSQL");

  // ✅ Load deployed contract addresses
  const deploymentJsonPath = path.join(__dirname, "../../Backend/src/contracts.json");
  if (!fs.existsSync(deploymentJsonPath))
    throw new Error("Deployment JSON not found at " + deploymentJsonPath);
  const deployedContracts = JSON.parse(fs.readFileSync(deploymentJsonPath, "utf8"));

  // ✅ Get signer
  const [signer] = await ethers.getSigners();

  // ✅ Connect to deployed contracts
  const prescriptionManagement = await ethers.getContractAt(
    "PrescriptionManagement",
    deployedContracts.PRESCRIPTION_MANAGEMENT_ADDRESS
  );
  const drugSupplyChain = await ethers.getContractAt(
    "DrugSupplyChain",
    deployedContracts.DRUG_SUPPLY_CHAIN_ADDRESS
  );
  const userManagement = await ethers.getContractAt(
    "UserManagement",
    deployedContracts.USER_MANAGEMENT_ADDRESS
  );
  const regulatorOversight = await ethers.getContractAt(
    "RegulatorOversight",
    deployedContracts.REGULATOR_OVERSIGHT_ADDRESS
  );

  // Bootstrap user roles and registration after node restart
  await bootstrapUsers(signer, userManagement);

  // ✅ Helper: log blockchain event to DB
  async function logEvent(eventName, contractName, entityType, txHash) {
    if (!txHash || txHash === "0x" || txHash.length < 10) {
      console.warn(`⚠️ Skipping event log for ${eventName} - missing or invalid transactionHash`);
      return;
    }
    try {
      await db.query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entitytype, transactionhash, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [eventName, contractName, entityType, txHash, true]
      );
      console.log(`🧾 Logged: ${eventName} from ${contractName}`);
    } catch (err) {
      console.error("❌ Error logging event:", err.message);
    }
  }

  // ========== 🧩 EVENT LISTENERS ========== //

  // 🧠 Prescription events
  prescriptionManagement.on("PrescriptionCreated", async (...args) => {
    const event = args[args.length - 1];
    // Always use contract.connect(signer) for interactions
    await logEvent("PrescriptionCreated", "PrescriptionManagement", "prescription", event.transactionHash);
  });

  // 💊 Drug supply events
  drugSupplyChain.on("BatchTransferred", async (...args) => {
    const event = args[args.length - 1];
    await logEvent("BatchTransferred", "DrugSupplyChain", "drugbatch", event.transactionHash);
  });

  // 👥 User Management Events

  // User Registered
  userManagement.on("UserRegistered", async (wallet, roleId, status, metadata, event) => {
    // Robustly extract transactionHash and blockNumber
    const txHash = event.transactionHash || (event.log && event.log.transactionHash);
    const blockNumber = event.blockNumber || (event.log && event.log.blockNumber);
    await logEvent("UserRegistered", "UserManagement", "user", txHash);
    console.log(`👤 UserRegistered | Wallet: ${wallet} | Role: ${roleId} | Status: ${status}`);

    try {
      await db.query(
        `UPDATE users
         SET isverified = true,
             status = 'pending',
             transaction_hash = $2,
             block_number = $3,
             updatedat = NOW()
         WHERE LOWER(wallet_address) = LOWER($1)`,
        [wallet, txHash || null, blockNumber || null]
      );
      console.log(`🗂️ Synced user ${wallet} as pending with txHash: ${txHash}`);
    } catch (err) {
      console.error("❌ Failed to sync UserRegistered:", err.message);
    }
  });

  // User Status Updated
  userManagement.on("UserStatusUpdated", async (wallet, newStatus, event) => {
    // Robustly extract transactionHash and blockNumber
    const txHash = event.transactionHash || (event.log && event.log.transactionHash);
    const blockNumber = event.blockNumber || (event.log && event.log.blockNumber);
    await logEvent("UserStatusUpdated", "UserManagement", "user", txHash);
    console.log(`⚙️ UserStatusUpdated | Wallet: ${wallet} | New Status: ${newStatus}`);

    // Map numeric status to enum string
    const statusMap = {
      0: 'pending',
      1: 'active',
      2: 'suspended',
      3: 'inactive'
    };
    let statusValue = statusMap[newStatus];
    // If newStatus is a string number, convert to int
    if (typeof newStatus === 'string' && !isNaN(newStatus)) {
      statusValue = statusMap[parseInt(newStatus)];
    }
    if (!statusValue) {
      console.error(`❌ Invalid status value for UserStatusUpdated: ${newStatus}`);
      return;
    }
    try {
      await db.query(
        `UPDATE users
         SET status = $1,
             transaction_hash = $2,
             block_number = $3,
             updatedat = NOW()
         WHERE LOWER(wallet_address) = LOWER($4)`,
        [statusValue, txHash || null, blockNumber || null, wallet]
      );
      console.log(`🗂️ Updated user status for ${wallet} with txHash: ${txHash}`);
    } catch (err) {
      console.error("❌ Failed to sync UserStatusUpdated:", err.message);
    }
  });

  // User Role Updated
  userManagement.on("UserRoleUpdated", async (wallet, newRoleId, event) => {
    await logEvent("UserRoleUpdated", "UserManagement", "user", event.transactionHash);
    console.log(`🔁 UserRoleUpdated | Wallet: ${wallet} | Role ID: ${newRoleId}`);

    try {
      await db.query(
        `UPDATE users
         SET role = $1,
             updatedat = NOW()
         WHERE LOWER(wallet_address) = LOWER($2)`,
        [newRoleId, wallet]
      );
      console.log(`🗂️ Updated user role for ${wallet}`);
    } catch (err) {
      console.error("❌ Failed to sync UserRoleUpdated:", err.message);
    }
  });

  // Role Created
  userManagement.on("RoleCreated", async (roleId, name, event) => {
    await logEvent("RoleCreated", "UserManagement", "role", event.transactionHash);
    console.log(`🏷️ RoleCreated | ID: ${roleId} | Name: ${name}`);
  });

  // Admin Added
  userManagement.on("AdminAdded", async (newAdmin, event) => {
    await logEvent("AdminAdded", "UserManagement", "admin", event.transactionHash);
    console.log(`👑 AdminAdded | Address: ${newAdmin}`);
  });

  // Admin Removed
  userManagement.on("AdminRemoved", async (removedAdmin, event) => {
    await logEvent("AdminRemoved", "UserManagement", "admin", event.transactionHash);
    console.log(`⚠️ AdminRemoved | Address: ${removedAdmin}`);
  });

  // Regulator Oversight
  regulatorOversight.on("AuditLogged", async (...args) => {
    const event = args[args.length - 1];
    await logEvent("AuditLogged", "RegulatorOversight", "audit", event.transactionHash);
    console.log(`📋 AuditLogged | Tx: ${event.transactionHash}`);
  });

  console.log("🔗 Listening for blockchain events...");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
