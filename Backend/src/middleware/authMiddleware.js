import { verifyJwt } from '../utils/jwtUtils.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);

    // Ensure the role exists and is valid
    const validRoles = ['doctor', 'patient', 'pharmacist', 'manufacturer', 'distributor', 'regulator', 'admin'];
    if (!validRoles.includes(payload.role)) {
      return res.status(403).json({ message: 'User role not authorized' });
    }

    // Attach user info to req
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
