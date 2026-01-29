import * as amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

export async function createRabbitMQConnection(): Promise<amqplib.ChannelModel> {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    return connection;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export async function createChannel(
  connection: amqplib.ChannelModel,
): Promise<amqplib.Channel> {
  try {
    const channel = await connection.createChannel();
    return channel;
  } catch (error) {
    console.error('Failed to create RabbitMQ channel:', error);
    throw error;
  }
}
