import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../db.js';
import { processChatMessage } from '../services/geminiChatService.js';

const router = express.Router();

// Middleware to optionally extract user context if Bearer token is provided
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_trendvibe_2026');
    const user = await findUserById(decoded.id);
    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    } else {
      req.user = null;
    }
  } catch {
    // If token expired or invalid, treat as guest
    req.user = null;
  }
  next();
}

/**
 * POST /api/chat
 * Handle chat inquiries with Google Gemini grounded in MySQL database.
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A valid text message is required.' });
    }

    const { reply, productsMentioned, cartActions } = await processChatMessage({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      user: req.user
    });

    return res.json({
      reply,
      productsMentioned: productsMentioned || [],
      cartActions: cartActions || [],
      userContext: req.user ? { name: req.user.name, email: req.user.email } : null
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);

    // Provide friendly fallback message
    return res.status(500).json({
      message: 'Failed to process AI chat request.',
      reply: "I'm temporarily having trouble connecting to my styling engine. Please feel free to browse our products or try asking again in a moment.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
