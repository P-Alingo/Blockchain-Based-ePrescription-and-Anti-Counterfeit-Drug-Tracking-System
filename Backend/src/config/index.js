// config/index.js
require('dotenv').config();
const contracts = require('../util/contracts'); // contracts.json loader

const {
  PORT = 3000,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRY = '12h',
  ETHEREUM_RPC_URL,
  TWO_FA_SECRET_KEY,
  FRONTEND_URL = '*',
} = process.env;

module.exports = {
  // Core environment vars
  PORT: Number(PORT),
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRY,
  ETHEREUM_RPC_URL,
  TWO_FA_SECRET_KEY,
  FRONTEND_URL,

  // Smart contract addresses (from contracts.json if available)
  USER_MANAGEMENT_ADDRESS: contracts.USER_MANAGEMENT_ADDRESS || process.env.USER_MANAGEMENT_ADDRESS,
  DRUG_SUPPLY_CHAIN_ADDRESS: contracts.DRUG_SUPPLY_CHAIN_ADDRESS || process.env.DRUG_SUPPLY_CHAIN_ADDRESS,
  PRESCRIPTION_ADDRESS: contracts.PRESCRIPTION_ADDRESS || process.env.PRESCRIPTION_ADDRESS,
  REGULATOR_OVERSIGHT_ADDRESS: contracts.REGULATOR_OVERSIGHT_ADDRESS || process.env.REGULATOR_OVERSIGHT_ADDRESS,
};
