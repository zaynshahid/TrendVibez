import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

// Import route handlers
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import activityLogsRoutes from './routes/activityLogs.js';
import categoryRoutes from './routes/categories.js';

const app = express();

// Initialize JSON database storage
initDb();

// Global Middlewares
app.use(cors({
  origin: '*', // For development, allow any front-end source
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TrendVibe API is running' });
});

// Register Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/activity-logs', activityLogsRoutes);
app.use('/api/categories', categoryRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.url}` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
