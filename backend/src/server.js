// IMPORTANT: dotenv must be configured via a side-effect import BEFORE
// any other module that reads process.env.
import './env.js';
import app from './app.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 5000;

await initDb();

const server = app.listen(PORT, () => {
  console.log('=========================================');
  console.log(`TrendVibe API Server running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log('=========================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use by another process.`);
    console.error(`👉 Please stop the process running on port ${PORT} (e.g. run 'npx kill-port ${PORT}' or 'taskkill /F /IM node.exe').\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

