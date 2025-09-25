import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1d";

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export { JWT_SECRET, JWT_EXPIRATION, signJwt, verifyJwt };
