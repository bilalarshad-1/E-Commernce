const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
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

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://api.qrserver.com", "https://barcode.tec-it.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.qrserver.com"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));

Compression for better performance
app.use(compression());

// Body parser with increased limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// ============================================
// MOUNT ROUTES - USING /api/ (NO VERSION)
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
// STATIC FILES (for uploads if needed)
// ============================================
app.use('/uploads', express.static('uploads'));

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
    path: req.originalUrl,
    method: req.method,
  });
});

// Mongoose duplicate key error handler
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  return {
    status: 400,
    message: `${field} already exists. Please use a different ${field}.`,
  };
};

// Mongoose validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(e => e.message);
  return {
    status: 400,
    message: 'Validation Error',
    errors,
  };
};

// JWT error handler
const handleJWTError = () => ({
  status: 401,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  status: 401,
  message: 'Your token has expired. Please log in again.',
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  let error = { ...err };
  error.message = err.message;
  error.status = err.status || 500;
  
  // Handle specific Mongoose errors
  if (err.code === 11000) {
    const handled = handleDuplicateKeyError(err);
    error.status = handled.status;
    error.message = handled.message;
  }
  
  if (err.name === 'ValidationError') {
    const handled = handleValidationError(err);
    error.status = handled.status;
    error.message = handled.message;
    error.errors = handled.errors;
  }
  
  if (err.name === 'JsonWebTokenError') {
    const handled = handleJWTError();
    error.status = handled.status;
    error.message = handled.message;
  }
  
  if (err.name === 'TokenExpiredError') {
    const handled = handleJWTExpiredError();
    error.status = handled.status;
    error.message = handled.message;
  }
  
  // Send error response
  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.toString(),
    }),
  });
});

// ============================================
// UNHANDLED PROMISE REJECTIONS
// ============================================
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;