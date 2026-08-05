// IMPORTANT: dotenv must be configured via a side-effect import BEFORE
// any other module that reads process.env (middleware, routes, etc.)
import './env.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 TrendVibe API Server running on port ${PORT}`);
  console.log(`👉 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
