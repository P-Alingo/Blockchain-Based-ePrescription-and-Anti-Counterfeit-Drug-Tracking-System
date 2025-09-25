import { ethers } from "ethers";
import { authenticator } from "otplib";
import bcrypt from "bcrypt";

export function verifyMetaMaskSignature(message, signature, address) {
  try {
    const signerAddress = ethers.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
}

export function generateTOTPSecret() {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri("user@example.com", "PharmaSupplyChain", secret);
  return { secret, otpauthUrl };
}

export function verifyTOTPCode(secret, code) {
  return authenticator.check(code, secret);
}

export async function hashData(data) {
  const saltRounds = 10;
  return bcrypt.hash(data, saltRounds);
}

export async function compareHashes(data, hash) {
  return bcrypt.compare(data, hash);
}
