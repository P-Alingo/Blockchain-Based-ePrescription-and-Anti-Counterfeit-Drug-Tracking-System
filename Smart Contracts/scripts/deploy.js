// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with account:", deployer.address);

  // 1. Deploy UserManagement
  const UserManagement = await ethers.getContractFactory("UserManagement");
  const userManagement = await UserManagement.deploy();
  await userManagement.waitForDeployment();

  const contractAddress = userManagement.target;
  console.log("✅ UserManagement deployed to:", contractAddress);

  // --- Directory setup ---
  const backendDir = path.join(__dirname, "../../Backend/src");
  const frontendDir = path.join(__dirname, "../../Frontend/src");
  [backendDir, frontendDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // --- ABI path ---
  const abiSourcePath = path.join(
    __dirname,
    "../artifacts/contracts/UserManagement.sol/UserManagement.json"
  );
  const abiDestinationPathBackend = path.join(backendDir, "UserManagementABI.json");
  const abiDestinationPathFrontend = path.join(frontendDir, "UserManagementABI.json");

  // Copy ABI to both backend and frontend
  const abiContent = JSON.parse(fs.readFileSync(abiSourcePath, "utf8"));
  fs.writeFileSync(abiDestinationPathBackend, JSON.stringify(abiContent.abi, null, 2));
  fs.writeFileSync(abiDestinationPathFrontend, JSON.stringify(abiContent.abi, null, 2));

  // --- Contract info ---
  const deploymentData = {
    USER_MANAGEMENT_ADDRESS: contractAddress,
    ADMIN_WALLET: deployer.address,
    ABI_PATH_BACKEND: abiDestinationPathBackend,
    ABI_PATH_FRONTEND: abiDestinationPathFrontend,
    DEPLOYMENT_NETWORK: network.name || "hardhat",
    DEPLOYMENT_TIMESTAMP: new Date().toISOString(),
  };

  // Write to JSON file
  const backendJsonPath = path.join(backendDir, "contracts.json");
  const frontendJsonPath = path.join(frontendDir, "contracts.json");
  fs.writeFileSync(backendJsonPath, JSON.stringify(deploymentData, null, 2));
  fs.writeFileSync(frontendJsonPath, JSON.stringify(deploymentData, null, 2));

  // --- Summary Log ---
  console.log("\n📦 Deployment Summary:");
  console.log("------------------------------");
  console.log("🧾 Contract Address:", contractAddress);
  console.log("🧩 ABI saved to:");
  console.log("   - Backend:", abiDestinationPathBackend);
  console.log("   - Frontend:", abiDestinationPathFrontend);
  console.log("👤 Admin Wallet:", deployer.address);
  console.log("🌐 Network:", network.name || "hardhat");
  console.log("🕒 Timestamp:", deploymentData.DEPLOYMENT_TIMESTAMP);
  console.log("------------------------------");
  console.log("✅ Deployment info saved to Backend/src/contracts.json & Frontend/src/contracts.json");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
