import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { EstablishConnection, getChannel, NOTIFICATION_QUEUE } from "./config/Mq.js";
import { formatNotification } from "./services/notification-formatter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        status: "healthy",
        service: "notification-microservice",
        timestamp: new Date().toISOString(),
        note: "Push notifications via Firebase have been disabled."
    });
});

/**
 * Consume notifications from RabbitMQ queue
 */
async function consumeNotifications() {
    const channel = getChannel();

    console.log(`[Notification] Listening for messages on queue: ${NOTIFICATION_QUEUE}`);

    channel.consume(
        NOTIFICATION_QUEUE,
        async (msg) => {
            if (msg) {
                try {
                    const notification = JSON.parse(msg.content.toString());
                    console.log("[Notification] Received notification:", notification);

                    const { userId, type, data, tokens } = notification;

                    // Format notification based on type
                    const formatted = formatNotification(type, data);

                    // Firebase is removed, so we just log the action that would have happened
                    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
                        console.log(`[Notification] (Disabled) Would send batch to ${tokens.length} devices:`, formatted.notification?.title);
                    } else if (notification.token) {
                        console.log(`[Notification] (Disabled) Would send to single device:`, formatted.notification?.title);
                    } else {
                        console.warn("[Notification] No tokens provided in notification");
                    }

                    // Acknowledge message so it doesn't stay in queue
                    channel.ack(msg);
                } catch (error) {
                    console.error("[Notification] Error processing notification:", error);
                    // Acknowledge even on error to prevent blocking, since we aren't really processing it
                    channel.ack(msg);
                }
            }
        },
        { noAck: false }
    );
}

const startServer = async () => {
    try {
        // Connect to RabbitMQ
        console.log("[Notification] Connecting to RabbitMQ...");
        await EstablishConnection();
        console.log("[Notification] RabbitMQ connected successfully");

        // Start consuming notifications
        consumeNotifications();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`[Notification] Microservice listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("[Notification] Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
