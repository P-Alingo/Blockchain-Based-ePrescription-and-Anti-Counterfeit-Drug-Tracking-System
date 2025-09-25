// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy UserManagement
  const UserManagement = await ethers.getContractFactory("UserManagement");
  const userManagement = await UserManagement.deploy();
  await userManagement.waitForDeployment();
  console.log("UserManagement deployed to:", userManagement.target);

  // 2. Deploy DrugSupplyChain
  const DrugSupplyChain = await ethers.getContractFactory("DrugSupplyChain");
  const drugSupplyChain = await DrugSupplyChain.deploy(userManagement.target);
  await drugSupplyChain.waitForDeployment();
  console.log("DrugSupplyChain deployed to:", drugSupplyChain.target);

  // 3. Deploy Prescription
  const Prescription = await ethers.getContractFactory("Prescription");
  const prescription = await Prescription.deploy(userManagement.target);
  await prescription.waitForDeployment();
  console.log("Prescription deployed to:", prescription.target);

  // 4. Deploy RegulatorOversight
  const RegulatorOversight = await ethers.getContractFactory("RegulatorOversight");
  const regulatorOversight = await RegulatorOversight.deploy(userManagement.target);
  await regulatorOversight.waitForDeployment();
  console.log("RegulatorOversight deployed to:", regulatorOversight.target);

  // Save deployed addresses into Backend/src/utils/contracts.json
  const contractsDir = path.join(__dirname, "../../Backend/src/utils");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const addresses = {
    USER_MANAGEMENT_ADDRESS: userManagement.target,
    DRUG_SUPPLY_CHAIN_ADDRESS: drugSupplyChain.target,
    PRESCRIPTION_ADDRESS: prescription.target,
    REGULATOR_OVERSIGHT_ADDRESS: regulatorOversight.target,
  };

  fs.writeFileSync(
    path.join(contractsDir, "contracts.json"),
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n Deployment complete. Contracts.json updated at Backend/src/utils/contracts.json:");
  console.log(addresses);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
