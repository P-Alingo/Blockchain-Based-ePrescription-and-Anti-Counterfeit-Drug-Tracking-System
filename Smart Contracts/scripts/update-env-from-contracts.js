// scripts/update-env-from-contracts.js
// Usage: node scripts/update-env-from-contracts.js
// Updates .env file with latest contract addresses from Backend/src/contracts.json

const fs = require('fs');
const path = require('path');

const contractsJsonPath = path.join(__dirname, '../../Backend/src/contracts.json');
const envPath = path.join(__dirname, '../../Backend/.env');

function updateEnvAddresses() {
  if (!fs.existsSync(contractsJsonPath)) {
    console.error('❌ contracts.json not found:', contractsJsonPath);
    process.exit(1);
  }
  const contracts = JSON.parse(fs.readFileSync(contractsJsonPath, 'utf8'));

  // Map of env keys to contract address fields
  const addressMap = {
    USER_MANAGEMENT_ADDRESS: contracts.USER_MANAGEMENT_ADDRESS,
    PRESCRIPTION_MANAGEMENT_ADDRESS: contracts.PRESCRIPTION_MANAGEMENT_ADDRESS,
    DRUG_SUPPLY_CHAIN_ADDRESS: contracts.DRUG_SUPPLY_CHAIN_ADDRESS,
    REGULATOR_OVERSIGHT_ADDRESS: contracts.REGULATOR_OVERSIGHT_ADDRESS
  };

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or insert each address
  Object.entries(addressMap).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('✅ .env updated with latest contract addresses');
}

updateEnvAddresses();
