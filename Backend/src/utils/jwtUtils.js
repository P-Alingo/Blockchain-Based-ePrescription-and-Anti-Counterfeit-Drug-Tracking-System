import jwt from 'jsonwebtoken';

export function generateJwt(payload) {
  const expiresIn = process.env.JWT_EXPIRY || '1h'; // Default fallback
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

