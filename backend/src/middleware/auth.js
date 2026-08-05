import jwt from 'jsonwebtoken';
import { findUserById } from '../db.js';

// Express middleware can be async. Express will handle any thrown errors
// that are caught, or we can catch them and call next(err) if needed.
// However, the existing implementation returns error responses inline.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_trendvibe_2026');
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found or session expired' });
    }

    // Attach basic user info (excluding password)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    next();
  });
}
