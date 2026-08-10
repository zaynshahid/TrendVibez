import express from 'express';
import { sendContactUsEmail } from '../services/emailService.js';
import { createSupportQuery } from '../db.js';

const router = express.Router();

// POST /api/contact - Send message to support
router.post('/', async (req, res) => {
  const { name, email, category, subject, message } = req.body;

  const activeSubject = subject || category || 'Support Inquiry';
  const activeCategory = category || subject || 'Other';

  if (!name || !email || !message || (!subject && !category)) {
    return res.status(400).json({ message: 'All fields (name, email, message, and subject/category) are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }

  try {
    // Save query to database
    await createSupportQuery({ name, email, category: activeCategory, message });

    // Send email to admin in background
    await sendContactUsEmail({ name, email, subject: activeSubject, message });

    res.json({ message: 'Your message has been sent successfully. We will get back to you shortly!' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
