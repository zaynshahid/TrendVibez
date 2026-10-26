import '../backend/src/env.js';
import app from '../backend/src/app.js';
import { initDb } from '../backend/src/db.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize MongoDB in serverless function:', err);
      return res.status(500).json({ error: 'Database connection failed', message: err.message });
    }
  }

  // Ensure req.url starts with /api if it was rewritten
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
