const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const YAML = require('yamljs');
const path = require('path');
const os = require('os');
const morgan = require('morgan');

// Import configuration and utilities
const config = require('./config/config');
const database = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { 
  generalLimiter, 
  authLimiter, 
  configureHelmet, 
  sanitizeData 
} = require('./middleware/security');

// Initialize Express app
const app = express();

// Security middleware
app.use(configureHelmet());
app.use(sanitizeData());

// CORS configuration
app.use(cors(config.cors));

// Request logging
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Swagger Configuration
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
const swaggerOptions = {
  definition: swaggerDocument,
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// Import routes
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const reportRoutes = require('./routes/reports');
const symptomProgressionRoutes = require('./routes/symptomProgression');

// Apply strict rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/symptom-progression', symptomProgressionRoutes);

// Health and utility routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Healthcare Management API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = database.getStatus();
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

// System metrics endpoint
app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbStatus = database.getStatus();
  
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
      },
      cpu: process.cpuUsage(),
      database: dbStatus,
      platform: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpuCount: os.cpus().length
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Simple ping endpoint
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

// Handle 404 - Must be after all other routes
app.all('*', notFound);

// Global error handler - Must be last
app.use(errorHandler);

// Initialize server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running in ${config.server.env} mode on port ${config.server.port}`);
      logger.info(`📚 API Documentation: http://localhost:${config.server.port}/api-docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await database.disconnect();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = app;





