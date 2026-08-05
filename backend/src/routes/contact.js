import express from 'express';
import { sendContactUsEmail } from '../services/emailService.js';

const router = express.Router();

// POST /api/contact - Send message to support
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields (name, email, subject, message) are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }

  try {
    // Send email to admin in background
    await sendContactUsEmail({ name, email, subject, message });

    res.json({ message: 'Your message has been sent successfully. We will get back to you shortly!' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
