const prisma = require('../config/prismaClient');
const ethers = require('ethers');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { JWT_SECRET, JWT_EXPIRY } = require('../config/env');
const logger = require('../utils/logger');

const nonceStore = new Map();
const NONCE_EXPIRATION = 10 * 60 * 1000;

function generateNonce() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifySignature(walletAddress, signature, nonce) {
  try {
    const message = `Authentication nonce: ${nonce}`;
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
}

exports.getNonce = (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });
  const nonce = generateNonce();
  nonceStore.set(walletAddress.toLowerCase(), { nonce, timestamp: Date.now() });
  res.json({ nonce });
};

exports.register = async (req, res) => {
  const { walletAddress, signature, role } = req.body;
  if (!walletAddress || !signature || !role) return res.status(400).json({ error: 'Missing parameters' });

  const stored = nonceStore.get(walletAddress.toLowerCase());
  if (!stored || Date.now() - stored.timestamp > NONCE_EXPIRATION) {
    return res.status(400).json({ error: 'Nonce expired or missing' });
  }

  const valid = await verifySignature(walletAddress, signature, stored.nonce);
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  try {
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { role },
      create: { walletAddress: walletAddress.toLowerCase(), role },
    });
    nonceStore.delete(walletAddress.toLowerCase());
    res.json({ message: 'Registration successful' });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { walletAddress, signature } = req.body;
  if (!walletAddress || !signature) return res.status(400).json({ error: 'Missing parameters' });

  const stored = nonceStore.get(walletAddress.toLowerCase());
  if (!stored || Date.now() - stored.timestamp > NONCE_EXPIRATION) {
    return res.status(400).json({ error: 'Nonce expired or missing' });
  }

  const valid = await verifySignature(walletAddress, signature, stored.nonce);
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  const user = await prisma.user.findUnique({ where: { walletAddress: walletAddress.toLowerCase() } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  nonceStore.delete(walletAddress.toLowerCase());

  if (user.is2FAEnabled) {
    return res.json({ twoFactorRequired: true });
  }

  const token = jwt.sign({ userId: user.id, role: user.role, twofaVerified: true }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json({ token, user: { id: user.id, walletAddress: user.walletAddress, role: user.role } });
};

exports.verify2FA = async (req, res) => {
  const { walletAddress, totpCode } = req.body;
  if (!walletAddress || !totpCode) return res.status(400).json({ error: 'Missing parameters' });

  const user = await prisma.user.findUnique({ where: { walletAddress: walletAddress.toLowerCase() } });
  if (!user || !user.twoFASecret) return res.status(400).json({ error: '2FA not setup' });

  const verified = speakeasy.totp.verify({
    secret: user.twoFASecret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  });

  if (!verified) return res.status(401).json({ error: 'Invalid 2FA token' });

  const jwtToken = jwt.sign({ userId: user.id, role: user.role, twofaVerified: true }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json({ token: jwtToken, user: { id: user.id, walletAddress: user.walletAddress, role: user.role } });
};
