const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const app = express();
const port = 3000;

// MongoDB connection
// adding mongo connection string with which is hostedin mongodb atlas
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://modugulaanjireddy18_db_user:r0H53qLCObKUZc9Z@cluster0.cncdtpb.mongodb.net/';

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Routes
const medicineRoutes = require('./routes/medicines');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reports', reportRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});
app.get('/api/info', async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'not connected';
  res.json({
    appName: 'MyApp Backend',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    database: dbState
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Server uptime route
app.get('/uptime', (req, res) => {
  res.json({
    uptimeSeconds: process.uptime(),
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString()
  });
});


// Extra diagnostics route (new addition only)
app.get('/info', (req, res) => {
  res.json({
    appName: 'MyApp Backend',
    version: '1.0.0',
    serverTime: new Date().toISOString()
  });
});

