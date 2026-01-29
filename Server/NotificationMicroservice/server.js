import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { EstablishConnection, getChannel, NOTIFICATION_QUEUE } from "./config/Mq.js";
import { initializeFirebase, sendNotification, sendBatchNotifications } from "./services/fcm.service.js";
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
    });
});

// Manual notification endpoint (for testing)
app.post("/send-test", async (req, res) => {
    try {
        const { token, title, body, data } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        const result = await sendNotification(
            token,
            { title: title || "Test Notification", body: body || "This is a test" },
            data || {}
        );

        res.json({ success: true, messageId: result });
    } catch (error) {
        console.error("[Notification] Test send error:", error);
        res.status(500).json({ error: error.message });
    }
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

                    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
                        // Send to multiple tokens (batch)
                        console.log(`[Notification] Sending to ${tokens.length} devices`);

                        const result = await sendBatchNotifications(
                            tokens,
                            formatted,
                            formatted.data
                        );

                        console.log(`[Notification] Batch result: ${result.successCount} sent, ${result.failureCount} failed`);

                        // TODO: Remove invalid tokens from database
                        if (result.invalidTokens && result.invalidTokens.length > 0) {
                            console.log(`[Notification] Invalid tokens to remove:`, result.invalidTokens);
                            // You could publish a message to another queue to clean up invalid tokens
                        }
                    } else if (notification.token) {
                        // Send to single token
                        console.log(`[Notification] Sending to single device`);

                        try {
                            const messageId = await sendNotification(
                                notification.token,
                                formatted,
                                formatted.data
                            );

                            console.log(`[Notification] Sent successfully: ${messageId}`);
                        } catch (error) {
                            if (error.code === 'INVALID_TOKEN') {
                                console.log(`[Notification] Invalid token detected: ${error.token}`);
                                // TODO: Publish message to remove this token from database
                            } else {
                                throw error;
                            }
                        }
                    } else {
                        console.warn("[Notification] No tokens provided in notification");
                    }

                    // Acknowledge message
                    channel.ack(msg);
                } catch (error) {
                    console.error("[Notification] Error processing notification:", error);

                    // Reject and requeue the message (with a limit to prevent infinite loops)
                    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;

                    if (retryCount < 3) {
                        console.log(`[Notification] Requeuing message (retry ${retryCount + 1}/3)`);
                        channel.nack(msg, false, true);
                    } else {
                        console.error(`[Notification] Max retries reached, discarding message`);
                        channel.nack(msg, false, false); // Don't requeue
                    }
                }
            }
        },
        { noAck: false }
    );
}

const startServer = async () => {
    try {
        // Initialize Firebase
        console.log("[Notification] Initializing Firebase...");
        initializeFirebase();
        console.log("[Notification] Firebase initialized successfully");

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
