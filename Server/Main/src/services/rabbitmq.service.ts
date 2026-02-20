import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { randomUUID } from 'crypto';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.ChannelModel;
  private channel: amqplib.Channel;
  private readonly RABBITMQ_URL =
    process.env.RABBITMQ_URL || 'amqp://localhost';
  private readonly CHAT_QUEUE = 'chat_requests';
  private readonly RESPONSE_QUEUE = 'chat_responses';
  private readonly HISTORY_REQUEST_QUEUE = 'chat_history_request';
  private readonly HEALTH_QUEUE = 'health_requests';
  private readonly HEALTH_RESPONSE_QUEUE = 'health_responses';
  private readonly HEALTH_SYNC_QUEUE = 'health_sync';
  private readonly NOTIFICATION_QUEUE = 'notification_queue';
  private readonly SESSION_STATUS_REQUEST_QUEUE = 'chat_session_status_request';

  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void; timeout: NodeJS.Timeout }>();

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      this.connection = await amqplib.connect(this.RABBITMQ_URL);

      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
      });
      this.connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
      });

      this.channel = await this.connection.createChannel();

      // Limit concurrent message processing for better throughput
      await this.channel.prefetch(10);

      // Assert queues
      await this.channel.assertQueue(this.CHAT_QUEUE, { durable: true });
      await this.channel.assertQueue(this.RESPONSE_QUEUE, { durable: true });
      await this.channel.assertQueue(this.HEALTH_QUEUE, { durable: true });
      await this.channel.assertQueue(this.HEALTH_RESPONSE_QUEUE, { durable: true });
      await this.channel.assertQueue(this.HEALTH_SYNC_QUEUE, { durable: true });
      await this.channel.assertQueue(this.NOTIFICATION_QUEUE, { durable: true });
      await this.channel.assertQueue(this.SESSION_STATUS_REQUEST_QUEUE, { durable: true });

      console.log('RabbitMQ connected and queues asserted');

      // Start consuming responses
      this.consumeResponses();
      this.consumeHealthResponses();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async sendChatRequest(userId: string, message: string, sessionId?: string) {
    const payload = {
      userId,
      message,
      sessionId: sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    try {
      this.channel.sendToQueue(
        this.CHAT_QUEUE,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );
      console.log('Chat request sent to queue:', payload);
      return payload.sessionId;
    } catch (error) {
      console.error('Failed to send chat request:', error);
      throw error;
    }
  }

  async fetchHealthData(dataType: string, userId?: string): Promise<any> {
    const correlationId = randomUUID();
    const payload = {
      type: dataType,
      correlationId,
      userId: userId || undefined,
      timestamp: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('Health service request timed out'));
      }, 15000) as any as NodeJS.Timeout; // 15 second timeout

      this.pendingRequests.set(correlationId, { resolve, reject, timeout });

      try {
        this.channel.sendToQueue(
          this.HEALTH_QUEUE,
          Buffer.from(JSON.stringify(payload)),
          { persistent: true },
        );
        console.log(`Health request sent: ${dataType}, userId: ${userId}, correlationId: ${correlationId}`);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(correlationId);
        reject(error);
      }
    });
  }

  async requestChatHistory(userId: string): Promise<any[]> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const correlationId = Math.random().toString() + Math.random().toString();
    const replyTo = await this.channel.assertQueue('', { exclusive: true });

    return new Promise((resolve, reject) => {
      // Listen for response
      this.channel.consume(
        replyTo.queue,
        (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            const content = JSON.parse(msg.content.toString());
            resolve(content.history);
            this.channel.deleteQueue(replyTo.queue);
          }
        },
        { noAck: true },
      );

      // Send request
      this.channel.sendToQueue(
        this.HISTORY_REQUEST_QUEUE,
        Buffer.from(JSON.stringify({ userId })),
        { correlationId, replyTo: replyTo.queue },
      );

      // Timeout
      setTimeout(() => {
        resolve([]); // Return empty history on timeout
      }, 5000);
    });
  }

  async requestChatSessions(userId: string): Promise<any[]> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    const correlationId = randomUUID();
    const replyTo = await this.channel.assertQueue('', { exclusive: true });

    return new Promise((resolve, reject) => {
      this.channel.consume(replyTo.queue, (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          const content = JSON.parse(msg.content.toString());
          resolve(content.sessions);
          this.channel.deleteQueue(replyTo.queue);
        }
      }, { noAck: true });

      this.channel.sendToQueue('chat_session_list_request',
        Buffer.from(JSON.stringify({ userId })),
        { correlationId, replyTo: replyTo.queue }
      );

      setTimeout(() => resolve([]), 5000);
    });
  }

  async requestSessionMessages(sessionId: string): Promise<any[]> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    const correlationId = randomUUID();
    const replyTo = await this.channel.assertQueue('', { exclusive: true });

    return new Promise((resolve, reject) => {
      this.channel.consume(replyTo.queue, (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          const content = JSON.parse(msg.content.toString());
          resolve(content.messages);
          this.channel.deleteQueue(replyTo.queue);
        }
      }, { noAck: true });

      this.channel.sendToQueue('chat_session_messages_request',
        Buffer.from(JSON.stringify({ sessionId })),
        { correlationId, replyTo: replyTo.queue }
      );

      setTimeout(() => resolve([]), 5000);
    });
  }

  /**
   * RPC: Ask ChatMicroservice for the status + aiResponse of a session.
   * Reads from MongoDB — no Redis involved.
   */
  async requestSessionStatus(sessionId: string): Promise<any | null> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    const correlationId = randomUUID();
    const replyTo = await this.channel.assertQueue('', { exclusive: true });

    return new Promise((resolve) => {
      this.channel.consume(replyTo.queue, (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          const content = JSON.parse(msg.content.toString());
          resolve(content.session ?? null);
          this.channel.deleteQueue(replyTo.queue);
        }
      }, { noAck: true });

      this.channel.sendToQueue(
        this.SESSION_STATUS_REQUEST_QUEUE,
        Buffer.from(JSON.stringify({ sessionId })),
        { correlationId, replyTo: replyTo.queue },
      );

      // Timeout — return null so the app keeps polling
      setTimeout(() => resolve(null), 4000);
    });
  }

  async sendHealthSync(data: any) {
    try {
      this.channel.sendToQueue(
        this.HEALTH_SYNC_QUEUE,
        Buffer.from(JSON.stringify(data)),
        { persistent: true },
      );
      console.log('Health sync data sent to queue:', data);
    } catch (error) {
      console.error('Failed to send health sync data:', error);
      throw error;
    }
  }

  async sendNotification(payload: { tokens?: string[]; token?: string; title?: string; message: string; type?: string }) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      this.channel.sendToQueue(
        this.NOTIFICATION_QUEUE,
        Buffer.from(JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
        })),
        { persistent: true },
      );
      console.log('Notification payload sent to queue:', payload);
    } catch (error) {
      console.error('Failed to send notification payload:', error);
      throw error;
    }
  }

  private async consumeResponses() {
    try {
      await this.channel.consume(
        this.RESPONSE_QUEUE,
        async (msg) => {
          if (msg) {
            const response = JSON.parse(msg.content.toString());
            console.log('Received AI response:', response);

            // Process the response (e.g., store in cache, notify client via websocket)
            // You can emit events here or store in Redis for client polling

            this.channel.ack(msg);
          }
        },
        { noAck: false },
      );
    } catch (error) {
      console.error('Failed to consume responses:', error);
    }
  }

  private async consumeHealthResponses() {
    try {
      await this.channel.consume(
        this.HEALTH_RESPONSE_QUEUE,
        async (msg) => {
          if (msg) {
            const response = JSON.parse(msg.content.toString());
            const { correlationId, data, error } = response;

            console.log(`Received health response for ${correlationId}`);

            if (this.pendingRequests.has(correlationId)) {
              const request = this.pendingRequests.get(correlationId);
              if (request) {
                const { resolve, reject, timeout } = request;
                clearTimeout(timeout);
                this.pendingRequests.delete(correlationId);

                if (error) {
                  reject(new Error(error));
                } else {
                  resolve(data);
                }
              }
            } else {
              console.warn(`Received response for unknown correlationId: ${correlationId}`);
            }

            this.channel.ack(msg);
          }
        },
        { noAck: false },
      );
    } catch (error) {
      console.error('Failed to consume health responses:', error);
    }
  }

  async disconnect() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('RabbitMQ disconnected');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }
}
