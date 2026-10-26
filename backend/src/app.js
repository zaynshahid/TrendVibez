import express from 'express';
import cors from 'cors';

// Import route handlers
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import activityLogsRoutes from './routes/activityLogs.js';
import categoryRoutes from './routes/categories.js';
import chatRoutes from './routes/chat.js';
import currencyRoutes from './routes/currency.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*', // For development and production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Router
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TrendVibe API is running' });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/contact', contactRoutes);
apiRouter.use('/admin/activity-logs', activityLogsRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/currency', currencyRoutes);

// Mount at both /api and / for flexible routing compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

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
