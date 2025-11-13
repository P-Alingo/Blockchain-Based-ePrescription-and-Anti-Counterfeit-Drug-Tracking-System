const hre = require("hardhat");
const { ethers } = hre;
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  // Connect to PostgreSQL
  const db = new Client({
    user: "postgres",
    host: "localhost",
    database: "eprescribe_kenya",
    password: "Mkenya04!",
    port: 5432,
  });
  await db.connect();
  console.log("✅ Connected to PostgreSQL");

  // Load deployed addresses from JSON
  const deploymentJsonPath = path.join(__dirname, "../../Backend/src/contracts.json");
  if (!fs.existsSync(deploymentJsonPath)) throw new Error("Deployment JSON not found at " + deploymentJsonPath);
  const deployedContracts = JSON.parse(fs.readFileSync(deploymentJsonPath, "utf8"));

  // Connect to deployed contracts using addresses from JSON
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

  // Helper to insert event into DB
  async function logEvent(eventName, contractName, entityType, txHash) {
    try {
      await db.query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entitytype, transactionhash, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [eventName, contractName, entityType, txHash, true]
      );
      console.log(`✅ Logged: ${eventName} from ${contractName}`);
    } catch (err) {
      console.error("❌ Error logging event:", err);
    }
  }

  // Event listeners
  prescriptionManagement.on("PrescriptionCreated", async (...args) => {
    const tx = args[args.length - 1];
    await logEvent("PrescriptionCreated", "PrescriptionManagement", "prescription", tx.transactionHash);
  });

  drugSupplyChain.on("BatchTransferred", async (...args) => {
    const tx = args[args.length - 1];
    await logEvent("BatchTransferred", "DrugSupplyChain", "drugbatch", tx.transactionHash);
  });

  userManagement.on("UserRegistered", async (...args) => {
    const tx = args[args.length - 1];
    await logEvent("UserRegistered", "UserManagement", "user", tx.transactionHash);
  });

  regulatorOversight.on("AuditLogged", async (...args) => {
    const tx = args[args.length - 1];
    await logEvent("AuditLogged", "RegulatorOversight", "audit", tx.transactionHash);
  });

  console.log("🔗 Listening for blockchain events...");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
