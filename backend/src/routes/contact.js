import express from 'express';
import { sendContactUsEmail } from '../services/emailService.js';
import { createSupportQuery } from '../db.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const contactRateLimit = createRateLimiter({
  scope: 'contact-email',
  limit: 5,
  windowMs: 60 * 60 * 1000
});

// POST /api/contact - Send message to support
router.post('/', contactRateLimit, async (req, res) => {
  const { name, email, category, subject, message } = req.body;

  const isValidText = (value, maxLength) => (
    typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
  );
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (
    !isValidText(name, 120) ||
    !isValidText(email, 254) ||
    !emailRegex.test(email.trim()) ||
    !isValidText(message, 5000) ||
    (!isValidText(subject, 200) && !isValidText(category, 100))
  ) {
    return res.status(400).json({ message: 'All fields (name, email, message, and subject/category) are required' });
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const activeSubject = (isValidText(subject, 200) ? subject : category || 'Support Inquiry').trim();
  const activeCategory = (isValidText(category, 100) ? category : subject || 'Other').trim();
  const normalizedMessage = message.trim();

  try {
    // Save query to database
    await createSupportQuery({
      name: normalizedName,
      email: normalizedEmail,
      category: activeCategory,
      message: normalizedMessage
    });

    // Send email to admin in background
    await sendContactUsEmail({
      name: normalizedName,
      email: normalizedEmail,
      subject: activeSubject,
      message: normalizedMessage
    });

    res.json({ message: 'Your message has been sent successfully. We will get back to you shortly!' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
