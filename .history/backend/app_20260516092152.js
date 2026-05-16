const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// Load env variables
dotenv.config();

// Connect DB
connectDB();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminCustomerRoutes = require('./routes/adminCustomerRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

/* =========================
   MIDDLEWARE (IMPORTANT ORDER)
   ========================= */

// CORS (ONLY ONCE)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight
app.options('*', cors());

/* =========================
   ROUTES
   ========================= */

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/orders', orderRoutes);

/* =========================
   404 HANDLER (FIXED - NO "*")
   ========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/* =========================
   GLOBAL ERROR HANDLER
   ========================= */

app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

module.exports = app;