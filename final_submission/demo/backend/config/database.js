/**
 * Database Connection Manager
 * Handles MongoDB connection with retry logic and graceful shutdown
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config/config');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect() {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      await mongoose.connect(config.database.uri, config.database.options);
      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('✅ Connected to MongoDB successfully');
      
      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      this.connectionAttempts++;
      logger.error(`❌ MongoDB connection error (attempt ${this.connectionAttempts}/${this.maxRetries}):`, {
        error: error.message,
        stack: error.stack
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        logger.error('❌ Max connection attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }

  /**
   * Set up MongoDB event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      
      // Attempt to reconnect
      if (this.connectionAttempts < this.maxRetries) {
        setTimeout(() => this.connect(), this.retryDelay);
      }
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
  }

  /**
   * Gracefully disconnect from MongoDB
   */
  async gracefulShutdown(signal) {
    logger.info(`${signal} signal received. Closing MongoDB connection...`);
    
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('✅ MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB disconnect:', error);
      process.exit(1);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseManager();
