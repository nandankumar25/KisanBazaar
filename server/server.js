const dotenv = require('dotenv');
// Load environment variables before requiring any routes or modules
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');

// Import Error Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import Routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mandiRoutes = require('./routes/mandiRoutes');
const mandiPriceRoutes = require('./routes/mandiPriceRoutes');
const mandiDemandRoutes = require('./routes/mandiDemandRoutes');
const mandiBookingRoutes = require('./routes/mandiBookingRoutes');
const cropLotRoutes = require('./routes/cropLotRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const transporterRoutes = require('./routes/transporterRoutes');
const transportRoutes = require('./routes/transportRoutes');
const offerRoutes = require('./routes/offerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware: Multi-Origin CORS for local dev flexibility (ports 3000, 3001, 5173, etc.)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mandis', mandiRoutes);
app.use('/api/mandi-prices', mandiPriceRoutes);
app.use('/api/mandi-demands', mandiDemandRoutes);
app.use('/api/mandi-bookings', mandiBookingRoutes);
app.use('/api/crop-lots', cropLotRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/transports', transportRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Root Fallback Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to KisanBazaar API Server',
    healthCheck: '/api/health',
    documentation: 'See API routes for /api/mandis, /api/mandi-prices, /api/crop-lots, /api/buyers, /api/transporters, /api/transports, /api/offers, /api/transactions',
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Port Configuration
const PORT = process.env.PORT || 5000;

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`KisanBazaar Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;

