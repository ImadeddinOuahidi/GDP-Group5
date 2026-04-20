/**
 * RabbitMQ Service for Backend
 * 
 * Handles publishing events to RabbitMQ for async processing
 */

const amqp = require('amqplib');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnecting = false;
    
    // Queue names
    this.queues = {
      reportCreated: 'report.created',
      reportUpdated: 'report.updated',
      reportProcessed: 'report.processed'
    };
  }

  /**
   * Connect to RabbitMQ
   */
  async connect() {
    if (this.isConnected) return;
    if (this.reconnecting) return;

    const url = process.env.RABBITMQ_URL;
    
    if (!url) {
      console.log('[RabbitMQ] No RABBITMQ_URL configured - events will not be published');
      return;
    }

    this.reconnecting = true;

    try {
      console.log('[RabbitMQ] Connecting...');
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Assert queues exist
      for (const queueName of Object.values(this.queues)) {
        await this.channel.assertQueue(queueName, { durable: true });
      }

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.isConnected = true;
      this.reconnecting = false;
      console.log('[RabbitMQ] Connected successfully');

    } catch (error) {
      console.error('[RabbitMQ] Connection failed:', error.message);
      this.reconnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnecting) return;
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, 5000);
  }

  /**
   * Publish a message to a queue
   */
  async publish(queueName, message) {
    if (!this.isConnected) {
      console.warn('[RabbitMQ] Not connected - message not published');
      return false;
    }

    try {
      const buffer = Buffer.from(JSON.stringify(message));
      
      this.channel.sendToQueue(queueName, buffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      });

      console.log(`[RabbitMQ] Published to ${queueName}:`, message.reportId || message.type);
      return true;

    } catch (error) {
      console.error('[RabbitMQ] Publish error:', error);
      return false;
    }
  }

  /**
   * Publish report created event
   */
  async publishReportCreated(report) {
    return this.publish(this.queues.reportCreated, {
      type: 'report.created',
      reportId: report._id.toString(),
      timestamp: new Date().toISOString(),
      data: {
        medicineId: report.medicine?.toString(),
        reporterRole: report.reporterRole,
        severity: report.sideEffects?.[0]?.severity
      }
    });
  }

  /**
   * Publish report updated event
   */
  async publishReportUpdated(reportId, changes) {
    return this.publish(this.queues.reportUpdated, {
      type: 'report.updated',
      reportId: reportId.toString(),
      timestamp: new Date().toISOString(),
      changes
    });
  }

  /**
   * Close connection
   */
  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
  }
}

// Singleton instance
const rabbitmqService = new RabbitMQService();

module.exports = rabbitmqService;
