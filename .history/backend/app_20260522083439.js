const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminCustomerRoutes = require('./routes/adminCustomerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const heroRoutes = require('./routes/heroRoutes');
const couponRoutes = require('./routes/couponRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const taxRoutes = require('./routes/taxRoutes');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
//     uptime: process.uptime(),
//   });
// });

// ============================================
// MOUNT ROUTES
// ============================================

// Authentication & Users
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Audit Logs
app.use('/api/audit-logs', auditRoutes);

// Products & Categories
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Customers
app.use('/api/customers', customerRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);

// Orders
app.use('/api/orders', orderRoutes);

// Coupons
app.use('/api/coupons', couponRoutes);

// Shipping Settings
app.use('/api/shipping', shippingRoutes);

// Tax Settings
app.use('/api/tax', taxRoutes);

// Newsletter & Hero
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/admin/hero', heroRoutes);

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static('uploads'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// Global error handler
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
  
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal Server Error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//   });
// });

// ============================================
// UNHANDLED REJECTIONS
// ============================================
// process.on('unhandledRejection', (err) => {
//   console.error('UNHANDLED REJECTION!', err);
// });

// process.on('uncaughtException', (err) => {
//   console.error('UNCAUGHT EXCEPTION!', err);
// });

module.exports = app;