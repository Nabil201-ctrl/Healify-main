import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { EstablishConnection, getChannel, NOTIFICATION_QUEUE } from './config/Mq.js';
import { formatNotification } from './services/notification-formatter.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 3003;

// The Main NestJS server base URL — used to persist notifications
const MAIN_API_URL = process.env.MAIN_API_URL || 'https://healify-main.vercel.app';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'healify-internal-secret';

app.use(cors());
app.use(express.json());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Notification]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'notification-microservice',
        transport: 'in-app (MongoDB)',
        timestamp: new Date().toISOString(),
    });
});

// ─── Core: Persist notification to MongoDB via Main server ────────────────────

async function persistNotification(userId, type, title, message) {
    try {
        await axios.post(`${MAIN_API_URL}/users/notifications/internal`, {
            userId,
            type,
            title,
            message,
            secret: INTERNAL_SECRET,
        });
        console.log(`[Notification] Persisted → userId: ${userId}, type: ${type}`);
    } catch (err) {
        console.error('[Notification] Failed to persist notification:', err?.response?.data ?? err.message);
    }
}

// ─── Build notification title/message from type + raw payload ─────────────────

function buildNotification(type, payload) {
    // Use the formatter to get a nice title + body
    const formatted = formatNotification(type, payload);

    return {
        title: formatted.title ?? payload.title ?? 'Healify',
        message: formatted.body ?? payload.message ?? 'You have a new notification',
    };
}

// ─── RabbitMQ consumer ────────────────────────────────────────────────────────

async function consumeNotifications() {
    const channel = getChannel();
    if (!channel) {
        console.warn('[Notification] Channel not ready, retrying in 1s...');
        setTimeout(consumeNotifications, 1000);
        return;
    }

    console.log(`[Notification] Listening on queue: ${NOTIFICATION_QUEUE}`);

    channel.consume(
        NOTIFICATION_QUEUE,
        async (msg) => {
            if (!msg) return;

            try {
                const payload = JSON.parse(msg.content.toString());
                console.log('[Notification] Received:', payload);

                const { userId, type, message, title, data } = payload;

                if (!userId) {
                    console.warn('[Notification] Missing userId — cannot persist:', payload);
                    channel.ack(msg);
                    return;
                }

                // Build a clean title + message
                const { title: nTitle, message: nMessage } = buildNotification(
                    type,
                    { ...(data ?? {}), message, title }
                );

                // Persist to MongoDB via Main server
                await persistNotification(userId, type ?? 'GENERAL', nTitle, nMessage);

                channel.ack(msg);
            } catch (error) {
                console.error('[Notification] Error processing message:', error);
                channel.ack(msg); // ack to prevent queue blocking
            }
        },
        { noAck: false }
    );
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function startServer() {
    try {
        await EstablishConnection();
        await consumeNotifications();

        app.listen(PORT, () => {
            console.log(`[Notification] Microservice running on port ${PORT}`);
            console.log(`[Notification] Persisting to: ${MAIN_API_URL}/users/notifications/internal`);
        });
    } catch (error) {
        console.error('[Notification] Failed to start:', error);
        process.exit(1);
    }
}

startServer();
