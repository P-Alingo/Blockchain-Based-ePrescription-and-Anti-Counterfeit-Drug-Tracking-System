// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with account:", deployer.address);

  // 1. Deploy UserManagement (Foundation Contract)
  console.log("\n📋 Step 1: Deploying UserManagement...");
  const UserManagement = await ethers.getContractFactory("UserManagement");
  const userManagement = await UserManagement.deploy();
  await userManagement.waitForDeployment();
  const userManagementAddress = userManagement.target;
  console.log("✅ UserManagement deployed to:", userManagementAddress);

  // 2. Deploy RegulatorOversight (Depends on UserManagement)
  console.log("\n📋 Step 2: Deploying RegulatorOversight...");
  const RegulatorOversight = await ethers.getContractFactory("RegulatorOversight");
  const regulatorOversight = await RegulatorOversight.deploy(userManagementAddress);
  await regulatorOversight.waitForDeployment();
  const regulatorOversightAddress = regulatorOversight.target;
  console.log("✅ RegulatorOversight deployed to:", regulatorOversightAddress);

  // 3. Deploy DrugSupplyChain (Depends on UserManagement)
  console.log("\n📋 Step 3: Deploying DrugSupplyChain...");
  const DrugSupplyChain = await ethers.getContractFactory("DrugSupplyChain");
  const drugSupplyChain = await DrugSupplyChain.deploy(userManagementAddress);
  await drugSupplyChain.waitForDeployment();
  const drugSupplyChainAddress = drugSupplyChain.target;
  console.log("✅ DrugSupplyChain deployed to:", drugSupplyChainAddress);

  // 4. Deploy PrescriptionManagement (Depends on UserManagement)
  console.log("\n📋 Step 4: Deploying PrescriptionManagement...");
  const PrescriptionManagement = await ethers.getContractFactory("PrescriptionManagement");
  const prescriptionManagement = await PrescriptionManagement.deploy(userManagementAddress);
  await prescriptionManagement.waitForDeployment();
  const prescriptionManagementAddress = prescriptionManagement.target;
  console.log("✅ PrescriptionManagement deployed to:", prescriptionManagementAddress);

  // --- Directory setup ---
  const backendDir = path.join(__dirname, "../../Backend/src");
  const frontendDir = path.join(__dirname, "../../Frontend/src");
  [backendDir, frontendDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // --- Copy ABIs for all contracts ---
  const contracts = [
    { name: "UserManagement", address: userManagementAddress },
    { name: "RegulatorOversight", address: regulatorOversightAddress },
    { name: "DrugSupplyChain", address: drugSupplyChainAddress },
    { name: "PrescriptionManagement", address: prescriptionManagementAddress }
  ];

  console.log("\n📁 Copying ABIs to backend and frontend...");

  contracts.forEach(contract => {
    const abiSourcePath = path.join(
      __dirname,
      `../artifacts/contracts/${contract.name}.sol/${contract.name}.json`
    );
    
    const abiDestinationPathBackend = path.join(backendDir, `${contract.name}ABI.json`);
    const abiDestinationPathFrontend = path.join(frontendDir, `${contract.name}ABI.json`);

    // Copy ABI to both backend and frontend
    if (fs.existsSync(abiSourcePath)) {
      const abiContent = JSON.parse(fs.readFileSync(abiSourcePath, "utf8"));
      fs.writeFileSync(abiDestinationPathBackend, JSON.stringify(abiContent.abi, null, 2));
      fs.writeFileSync(abiDestinationPathFrontend, JSON.stringify(abiContent.abi, null, 2));
      console.log(`✅ ${contract.name} ABI copied`);
    } else {
      console.log(`⚠️  ABI not found for ${contract.name} at ${abiSourcePath}`);
    }
  });

  // --- Contract info ---
  const deploymentData = {
    // Contract Addresses
    USER_MANAGEMENT_ADDRESS: userManagementAddress,
    REGULATOR_OVERSIGHT_ADDRESS: regulatorOversightAddress,
    DRUG_SUPPLY_CHAIN_ADDRESS: drugSupplyChainAddress,
    PRESCRIPTION_MANAGEMENT_ADDRESS: prescriptionManagementAddress,
    
    // Deployment Info
    ADMIN_WALLET: deployer.address,
    DEPLOYMENT_NETWORK: network.name || "hardhat",
    DEPLOYMENT_TIMESTAMP: new Date().toISOString(),
    
    // ABI Paths
    ABI_PATHS: {
      BACKEND: {
        USER_MANAGEMENT: path.join(backendDir, "UserManagementABI.json"),
        REGULATOR_OVERSIGHT: path.join(backendDir, "RegulatorOversightABI.json"),
        DRUG_SUPPLY_CHAIN: path.join(backendDir, "DrugSupplyChainABI.json"),
        PRESCRIPTION_MANAGEMENT: path.join(backendDir, "PrescriptionManagementABI.json")
      },
      FRONTEND: {
        USER_MANAGEMENT: path.join(frontendDir, "UserManagementABI.json"),
        REGULATOR_OVERSIGHT: path.join(frontendDir, "RegulatorOversightABI.json"),
        DRUG_SUPPLY_CHAIN: path.join(frontendDir, "DrugSupplyChainABI.json"),
        PRESCRIPTION_MANAGEMENT: path.join(frontendDir, "PrescriptionManagementABI.json")
      }
    },
    
    // Contract Dependencies
    DEPENDENCIES: {
      REGULATOR_OVERSIGHT: ["USER_MANAGEMENT"],
      DRUG_SUPPLY_CHAIN: ["USER_MANAGEMENT"],
      PRESCRIPTION_MANAGEMENT: ["USER_MANAGEMENT"]
    }
  };

  // Write to JSON files
  const backendJsonPath = path.join(backendDir, "contracts.json");
  const frontendJsonPath = path.join(frontendDir, "contracts.json");
  fs.writeFileSync(backendJsonPath, JSON.stringify(deploymentData, null, 2));
  fs.writeFileSync(frontendJsonPath, JSON.stringify(deploymentData, null, 2));

  // --- Summary Log ---
  console.log("\n🎉 Deployment Summary:");
  console.log("========================================");
  console.log("🏗️  Contract Architecture:");
  console.log("   └── UserManagement (Foundation)");
  console.log("       ├── RegulatorOversight");
  console.log("       ├── DrugSupplyChain");
  console.log("       └── PrescriptionManagement");
  
  console.log("\n📍 Contract Addresses:");
  console.log("   📋 UserManagement:", userManagementAddress);
  console.log("   👮 RegulatorOversight:", regulatorOversightAddress);
  console.log("   💊 DrugSupplyChain:", drugSupplyChainAddress);
  console.log("   📝 PrescriptionManagement:", prescriptionManagementAddress);
  
  console.log("\n👤 Deployment Info:");
  console.log("   👑 Admin Wallet:", deployer.address);
  console.log("   🌐 Network:", network.name || "hardhat");
  console.log("   🕒 Timestamp:", deploymentData.DEPLOYMENT_TIMESTAMP);
  
  console.log("\n📁 Files Created:");
  console.log("   📄 Backend: contracts.json & ABIs");
  console.log("   📄 Frontend: contracts.json & ABIs");
  console.log("========================================");
  console.log("✅ All contracts deployed successfully!");
  console.log("✅ Deployment info saved to Backend/src/contracts.json & Frontend/src/contracts.json");

  // --- Verification Instructions ---
  console.log("\n🔍 Next Steps:");
  console.log("   1. Run tests: npx hardhat test");
  console.log("   2. Verify on block explorer (if on testnet/mainnet)");
  console.log("   3. Start integrating with frontend/backend");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});