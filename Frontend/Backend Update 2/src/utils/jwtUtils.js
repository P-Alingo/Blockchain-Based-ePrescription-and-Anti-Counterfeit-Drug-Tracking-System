import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;
const tokenExpiry = "1h";

function generateJwt(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: tokenExpiry });
}

function verifyJwt(token) {
  return jwt.verify(token, jwtSecret);
}

export { generateJwt, verifyJwt };
