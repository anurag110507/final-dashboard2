require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Global flag for MongoDB connection status
let mongoConnected = false;

// MongoDB Connection with fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ev-charging-hub';

mongoose.connect(MONGODB_URI)
  .then(() => {
    mongoConnected = true;
    console.log('✅ MongoDB connected');
  })
  .catch(err => {
    mongoConnected = false;
    console.warn('⚠️ MongoDB connection failed - using fallback demo data:', err.message);
  });

// Fallback demo data for when MongoDB is unavailable
const DEMO_CHARGERS = [
  {
    _id: 'demo-charger-1',
    name: 'Oxford Street Hub',
    address: '123 Oxford Street, London W1D 2EH',
    latitude: 51.5161,
    longitude: -0.1426,
    chargerType: 'DC Fast',
    totalSlots: 8,
    availableSlots: 6,
    rating: 4.8
  },
  {
    _id: 'demo-charger-2',
    name: 'Tower Bridge Plaza',
    address: 'Tower Bridge, London SE1 2UP',
    latitude: 51.5055,
    longitude: -0.0754,
    chargerType: 'Level 2',
    totalSlots: 6,
    availableSlots: 2,
    rating: 4.5
  },
  {
    _id: 'demo-charger-3',
    name: 'Green Park Station',
    address: 'Green Park, London SW1A 1AX',
    latitude: 51.5036,
    longitude: -0.1496,
    chargerType: 'Level 2',
    totalSlots: 4,
    availableSlots: 1,
    rating: 4.2
  }
];

const DEMO_USERS = [
  {
    _id: 'demo-user-1',
    name: 'John Smith',
    greenScore: 175,
    totalChargingTime: 17.5
  },
  {
    _id: 'demo-user-2',
    name: 'Sarah Johnson',
    greenScore: 150,
    totalChargingTime: 15
  }
];

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chargers', require('./routes/chargers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/booking-requests', require('./routes/bookingRequests'));
app.use('/api/users', require('./routes/users'));

// Demo data endpoint (for troubleshooting)
app.get('/api/demo-status', (req, res) => {
  res.json({
    mongoConnected,
    message: mongoConnected ? 'Connected to MongoDB' : 'Using fallback demo data',
    chargers: DEMO_CHARGERS.length,
    users: DEMO_USERS.length
  });
});

// Fallback chargers endpoint if MongoDB fails
app.get('/api/chargers/demo', (req, res) => {
  if (!mongoConnected) {
    console.log('📊 Serving fallback demo chargers');
    return res.json(DEMO_CHARGERS);
  }
  res.status(503).json({ message: 'MongoDB required' });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/owner-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/owner-login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/owner.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/owner.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: err.message,
    demo: 'Using fallback data' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
