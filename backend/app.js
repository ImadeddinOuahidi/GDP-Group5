
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const YAML = require('yamljs');
const path = require('path');
const authRoutes = require('./routes/auth');
const app = express();
const port = 3000;

// MongoDB connection
// adding mongo connection string with which is hostedin mongodb atlas
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://modugulaanjireddy18_db_user:r0H53qLCObKUZc9Z@cluster0.cncdtpb.mongodb.net/';

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Swagger Configuration
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

const swaggerOptions = {
  definition: swaggerDocument,
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js'], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Healthcare API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

// Routes
const medicineRoutes = require('./routes/medicines');
const reportRoutes = require('./routes/reports');
const symptomProgressionRoutes = require('./routes/symptomProgression');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/symptom-progression', symptomProgressionRoutes);

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

// Server uptime route
app.get('/uptime', (req, res) => {
  res.json({
    uptimeSeconds: process.uptime(),
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString()
  });
});

// Environment info route
app.get('/env', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development'
  });
});
// Simple ping route
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', time: new Date().toISOString() });
});

app.get('/info', (req, res) => {
  res.json({
    appName: 'MyApp Backend',
    version: '1.0.0',
    serverTime: new Date().toISOString()
  });
});

// ✅ Random quote route
const quotes = [
  'Keep moving forward.',
  'Stay curious.',
  'Code. Commit. Repeat.'
];

app.get('/quote', (req, res) => {
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  res.json({ quote: random });
});

// Version info route
app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    message: 'Backend version endpoint working successfully'
  });
});

// Server summary route
app.get('/server-summary', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'not connected';
  res.json({
    status: 'running',
    uptimeSeconds: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbState,
    currentTime: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    uptimeSeconds: process.uptime(),
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
    },
    cpuUsage: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get('/time', (req, res) => {
  const now = new Date();
  res.json({
    localTime: now.toString(),
    utcTime: now.toISOString()
  });
});

// Time route
app.get('/time', (req, res) => {
  const now = new Date();
  res.json({
    serverTime: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    unixTimestamp: Math.floor(now.getTime() / 1000)
  });
});





