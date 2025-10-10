import jwt from 'jsonwebtoken';

export function generateJwt(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
}

export function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
