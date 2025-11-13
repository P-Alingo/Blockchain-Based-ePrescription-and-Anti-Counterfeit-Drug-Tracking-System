import { verifyJwt } from '../utils/jwtUtils.js';

export async function authMiddleware(req, res, next) {
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

    // If admin, bypass on-chain status check
    if (payload.role && payload.role.toLowerCase() === 'admin') {
      console.log('🔓 Admin access: bypassing on-chain status check');
      req.user = { id: payload.userId, role: payload.role };
      return next();
    } else {
      // Check on-chain status (async)
      const { getUserOnChain } = await import('../services/blockchainService.js');
      let onChainUser;
      try {
        onChainUser = await getUserOnChain(payload.walletAddress);
      } catch (err) {
        console.error('Blockchain status check failed:', err);
        return res.status(500).json({ message: 'Blockchain status check failed' });
      }
      // Status: 0=Pending, 1=Active, 2=Suspended, 3=Inactive
      if (!onChainUser || onChainUser.status !== 1) {
        return res.status(403).json({ message: 'User is not active on blockchain' });
      }
      // Attach user info to req
      req.user = { id: payload.userId, role: payload.role };
      return next();
    }
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
