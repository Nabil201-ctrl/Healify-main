import amqplib from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
export const NOTIFICATION_QUEUE = 'notification_queue';

let connection = null;
let channel = null;

export async function EstablishConnection() {
    try {
        console.log('[Notification/MQ] Connecting to RabbitMQ...');
        connection = await amqplib.connect(RABBITMQ_URL);

        connection.on('error', (err) => console.error('[Notification/MQ] Connection error:', err));
        connection.on('close', () => console.warn('[Notification/MQ] Connection closed'));

        channel = await connection.createChannel();
        await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

        console.log('[Notification/MQ] Connected and queue asserted');
        return channel;
    } catch (error) {
        console.error('[Notification/MQ] Failed to connect, retrying in 5s...', error.message);
        setTimeout(EstablishConnection, 5000);
    }
}

export function getChannel() {
    return channel;
}
