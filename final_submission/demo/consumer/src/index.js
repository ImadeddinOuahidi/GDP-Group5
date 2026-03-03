/**
 * ADR Report Consumer Service
 * 
 * Listens to RabbitMQ for new report events and processes them with Gemini AI
 * to analyze severity, extract metadata, and enhance report information.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RabbitMQService = require('./services/rabbitmqService');
const ReportProcessor = require('./processors/reportProcessor');

// Configuration
const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/adr_system'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queues: {
      reportCreated: 'report.created',
      reportProcessed: 'report.processed'
    }
  }
};

class ConsumerService {
  constructor() {
    this.rabbitMQ = null;
    this.reportProcessor = null;
    this.isShuttingDown = false;
  }

  /**
   * Initialize the consumer service
   */
  async initialize() {
    console.log('[Consumer] Starting ADR Report Consumer Service...');

    // Connect to MongoDB
    await this.connectMongoDB();

    // Initialize RabbitMQ
    this.rabbitMQ = new RabbitMQService(config.rabbitmq);
    await this.rabbitMQ.connect();

    // Initialize Report Processor
    this.reportProcessor = new ReportProcessor();

    // Set up message consumers
    await this.setupConsumers();

    console.log('[Consumer] Service initialized successfully');
  }

  /**
   * Connect to MongoDB
   */
  async connectMongoDB() {
    try {
      console.log('[Consumer] Connecting to MongoDB...');
      await mongoose.connect(config.mongodb.uri);
      console.log('[Consumer] MongoDB connected successfully');
    } catch (error) {
      console.error('[Consumer] MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Set up message consumers
   */
  async setupConsumers() {
    // Consumer for new reports
    await this.rabbitMQ.consume(
      config.rabbitmq.queues.reportCreated,
      async (message) => {
        if (this.isShuttingDown) return false;
        
        try {
          console.log(`[Consumer] Processing report: ${message.reportId}`);
          
          const result = await this.reportProcessor.process(message);
          
          if (result.success) {
            console.log(`[Consumer] Report ${message.reportId} processed successfully`);
            
            // Publish processed event for any downstream services
            await this.rabbitMQ.publish(config.rabbitmq.queues.reportProcessed, {
              reportId: message.reportId,
              status: 'processed',
              analysis: result.analysis,
              processedAt: new Date().toISOString()
            });
          } else {
            console.error(`[Consumer] Failed to process report ${message.reportId}:`, result.error);
          }
          
          return true; // Acknowledge message
        } catch (error) {
          console.error(`[Consumer] Error processing message:`, error);
          return false; // Reject and requeue
        }
      }
    );

    console.log(`[Consumer] Listening on queue: ${config.rabbitmq.queues.reportCreated}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[Consumer] Shutting down...');
    this.isShuttingDown = true;

    if (this.rabbitMQ) {
      await this.rabbitMQ.close();
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    console.log('[Consumer] Shutdown complete');
    process.exit(0);
  }
}

// Main entry point
const consumer = new ConsumerService();

// Handle graceful shutdown
process.on('SIGTERM', () => consumer.shutdown());
process.on('SIGINT', () => consumer.shutdown());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Consumer] Uncaught exception:', error);
  consumer.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Consumer] Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the consumer
consumer.initialize().catch((error) => {
  console.error('[Consumer] Failed to initialize:', error);
  process.exit(1);
});
