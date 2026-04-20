/**
 * RabbitMQ Service
 * 
 * Handles connection to RabbitMQ and message publishing/consuming
 */

const amqp = require('amqplib');

class RabbitMQService {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.channel = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
  }

  /**
   * Connect to RabbitMQ
   */
  async connect() {
    try {
      console.log('[RabbitMQ] Connecting to:', this.config.url.replace(/:[^:]*@/, ':****@'));
      
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();
      
      // Set up connection error handlers
      this.connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err);
        this.reconnect();
      });

      this.connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed');
        if (!this.isClosing) {
          this.reconnect();
        }
      });

      // Set prefetch for fair distribution
      await this.channel.prefetch(1);

      this.reconnectAttempts = 0;
      console.log('[RabbitMQ] Connected successfully');
      
      return this.channel;
    } catch (error) {
      console.error('[RabbitMQ] Connection failed:', error.message);
      await this.reconnect();
    }
  }

  /**
   * Reconnect to RabbitMQ
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RabbitMQ] Max reconnection attempts reached');
      throw new Error('Failed to connect to RabbitMQ');
    }

    this.reconnectAttempts++;
    console.log(`[RabbitMQ] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
    return this.connect();
  }

  /**
   * Assert a queue exists
   */
  async assertQueue(queueName, options = {}) {
    const defaultOptions = {
      durable: true,
      ...options
    };
    
    return this.channel.assertQueue(queueName, defaultOptions);
  }

  /**
   * Publish a message to a queue
   */
  async publish(queueName, message, options = {}) {
    try {
      await this.assertQueue(queueName);
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
        ...options
      };

      this.channel.sendToQueue(queueName, messageBuffer, publishOptions);
      console.log(`[RabbitMQ] Published to ${queueName}:`, message.reportId || 'message');
      
      return true;
    } catch (error) {
      console.error('[RabbitMQ] Publish error:', error);
      throw error;
    }
  }

  /**
   * Consume messages from a queue
   */
  async consume(queueName, handler) {
    try {
      await this.assertQueue(queueName);
      
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          const result = await handler(content);
          
          if (result !== false) {
            this.channel.ack(msg);
          } else {
            // Requeue the message
            this.channel.nack(msg, false, true);
          }
        } catch (error) {
          console.error('[RabbitMQ] Message handler error:', error);
          // Don't requeue on handler errors - send to DLQ
          this.channel.nack(msg, false, false);
        }
      });

      console.log(`[RabbitMQ] Consumer set up for queue: ${queueName}`);
    } catch (error) {
      console.error('[RabbitMQ] Consume setup error:', error);
      throw error;
    }
  }

  /**
   * Close the connection
   */
  async close() {
    this.isClosing = true;
    
    if (this.channel) {
      await this.channel.close();
    }
    
    if (this.connection) {
      await this.connection.close();
    }
    
    console.log('[RabbitMQ] Connection closed gracefully');
  }
}

module.exports = RabbitMQService;
