const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const therapistRoutes = require('./src/routes/therapistRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const availabilityRoutes = require('./src/routes/availabilityRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

const { setupSocket } = require('./src/services/socketService');
const errorHandler = require('./src/middleware/errorHandler');



const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

setupSocket(io);

app.use('/api/auth', authRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use(errorHandler);

const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  heartbeatFrequencyMS: 10000
};

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      server.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
      });
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⏳ Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting reconnect...');
  setTimeout(connectWithRetry, 3000);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

connectWithRetry();
