import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { 
  findUserByEmail, 
  findUserById, 
  createUser, 
  updateUser,
  createPasswordReset,
  getPasswordReset,
  deletePasswordReset
} from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Read JWT secret lazily so it picks up the value AFTER dotenv has loaded.
const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_jwt_secret_trendvibe_2026';
const JWT_EXPIRES_IN = '7d';

// Generate Token Utility
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  // Simple validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const userExists = await findUserByEmail(email);

    if (userExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = await createUser({
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    // Send welcome email in the background
    sendWelcomeEmail(newUser);

    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    let user = await findUserByEmail(email);

    if (!user) {
      // Auto-create user
      const namePart = email.split('@')[0];
      const name = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : 'New User';
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      user = await createUser({
        id: uuidv4(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      console.log(`Auto-created user on login: ${email}`);
      // Send welcome email in background
      sendWelcomeEmail(user);
    } else if (!user.password) {
      // If user has no password set (e.g. from Google login), set the provided password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      user = await updateUser(user.id, { password: hashedPassword });
      console.log(`Set password for existing passwordless user on login: ${email}`);
    } else {
      // Standard verification
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    const token = generateToken(user);

    // Log admin logins for audit trail
    if (user.role === 'admin') {
      logActivity({
        adminId: user.id,
        adminName: user.name,
        action: 'LOGIN',
        module: 'auth',
        recordId: user.id,
        ipAddress: getClientIp(req)
      });
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GOOGLE AUTHENTICATION
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential token is required' });
  }

  let email, name;

  // Mock Developer Google Token Bypass
  if (credential.startsWith('mock_google_token_')) {
    const payload = credential.replace('mock_google_token_', '');
    const separatorIndex = payload.indexOf('::');
    const endIndex = payload.lastIndexOf('::');
    if (separatorIndex !== -1 && endIndex !== separatorIndex) {
      name = payload.substring(separatorIndex + 2, endIndex);
      email = payload.substring(endIndex + 2).toLowerCase();
    } else {
      const parts = payload.split('|');
      name = parts[0] || 'Google User';
      email = (parts[1] || 'googleuser@example.com').toLowerCase();
    }
  } else if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).json({
      message: 'Google Sign-In is not configured on this server. Please use the Developer Sandbox buttons on the login page, or register with email and password.'
    });
  } else {
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email.toLowerCase();
      name = payload.name;
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(400).json({ message: 'Google sign-in verification failed. Check your Client ID configuration.' });
    }
  }

  try {
    let user = await findUserByEmail(email);

    if (!user) {
      // Auto-create user for Google Login
      user = await createUser({
        id: uuidv4(),
        name,
        email,
        password: null, // No password needed for Google auth users
        role: 'user',
        createdAt: new Date().toISOString()
      });
      console.log(`Auto-created Google user: ${email}`);
      // Send welcome email in background
      sendWelcomeEmail(user);
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google Auth Route Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET PROFILE
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// UPDATE PROFILE
router.put('/profile', requireAuth, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await findUserByEmail(email);
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.email = email.toLowerCase();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      const salt = bcrypt.genSaltSync(10);
      updates.password = bcrypt.hashSync(password, salt);
    }

    let updatedUser = user;
    if (Object.keys(updates).length > 0) {
      updatedUser = await updateUser(user.id, updates);
    }

    const token = generateToken(updatedUser);

    // Log profile updates for admin users
    if (req.user.role === 'admin' && Object.keys(updates).length > 0) {
      const safeOld = { name: user.name, email: user.email };
      const safeNew = {};
      if (updates.name)  safeNew.name  = updates.name;
      if (updates.email) safeNew.email = updates.email;
      if (updates.password) safeNew.password = '[changed]';

      logActivity({
        adminId: req.user.id,
        adminName: req.user.name,
        action: 'UPDATE_PROFILE',
        module: 'auth',
        recordId: req.user.id,
        oldData: safeOld,
        newData: safeNew,
        ipAddress: getClientIp(req)
      });
    }

    res.json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// FORGOT PASSWORD (Generate link & send email)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }

  try {
    const user = await findUserByEmail(email);

    if (user) {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration
      
      // Store token in database
      await createPasswordReset(user.email, token, expiresAt);

      // Generate reset URL
      const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

      // Send email (errors handled internally by emailService)
      await sendPasswordResetEmail(user, resetLink);
    }

    // Return generic success message to prevent user enumeration
    res.json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// RESET PASSWORD (Verify token and update password)
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const resetRecord = await getPasswordReset(token);

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const expiryTime = new Date(resetRecord.expiresAt).getTime();
    if (expiryTime < Date.now()) {
      await deletePasswordReset(resetRecord.email);
      return res.status(400).json({ message: 'Password reset token has expired' });
    }

    const user = await findUserByEmail(resetRecord.email);
    if (!user) {
      return res.status(404).json({ message: 'User associated with this token not found' });
    }

    // Update password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    await updateUser(user.id, { password: hashedPassword });

    // Clean up reset token
    await deletePasswordReset(resetRecord.email);

    res.json({ message: 'Your password has been successfully updated.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
