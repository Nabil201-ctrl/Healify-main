import amqlib from "amqplib";
import dotenv from "dotenv"
dotenv.config()
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const HEALTH_QUEUE = "health_requests";
const HEALTH_RESPONSE_QUEUE = "health_responses";
const NOTIFICATION_QUEUE = "notification_queue";
const HEALTH_SYNC_QUEUE = "health_sync";
const AI_CONTEXT_QUEUE = "ai_context_update";
const AI_CONTEXT_REQUEST_QUEUE = "ai_context_request";

let connection = null;
let channel = null;

async function EstablishConnection() {
    try {
        console.log("Connecting to RabbitMQ at:", RABBITMQ_URL.replace(/:[^:@]*@/, ':***@')); // Mask credentials
        connection = await amqlib.connect(RABBITMQ_URL);

        connection.on("error", (err) => {
            console.error("RabbitMQ connection error:", err);
        });

        connection.on("close", () => {
            console.warn("RabbitMQ connection closed");
        });

        channel = await connection.createChannel();

        // Assert queues
        await channel.assertQueue(HEALTH_QUEUE, { durable: true });
        await channel.assertQueue(HEALTH_RESPONSE_QUEUE, { durable: true });
        await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
        await channel.assertQueue(HEALTH_SYNC_QUEUE, { durable: true });
        await channel.assertQueue(AI_CONTEXT_QUEUE, { durable: true });
        await channel.assertQueue(AI_CONTEXT_REQUEST_QUEUE, { durable: true });

        console.log("Connected to RabbitMQ and queues asserted");
        return channel;
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
        throw error;
    }
}

function getChannel() {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized. Call EstablishConnection first.");
    }
    return channel;
}

async function publishResponse(response) {
    try {
        const ch = getChannel();
        ch.sendToQueue(
            HEALTH_RESPONSE_QUEUE,
            Buffer.from(JSON.stringify(response)),
            { persistent: true }
        );
        console.log("Response published to queue:", response.correlationId);
    } catch (error) {
        console.error("Failed to publish response:", error);
        throw error;
    }
}

async function publishNotification(notification) {
    try {
        const ch = getChannel();
        ch.sendToQueue(
            NOTIFICATION_QUEUE,
            Buffer.from(JSON.stringify(notification)),
            { persistent: true }
        );
        console.log("Notification published to queue:", notification.userId);
    } catch (error) {
        console.error("Failed to publish notification:", error);
    }
}

async function publishAIContextUpdate(context) {
    try {
        const ch = getChannel();
        ch.sendToQueue(
            AI_CONTEXT_QUEUE,
            Buffer.from(JSON.stringify(context)),
            { persistent: true }
        );
        console.log("AI Context update published:", context.type);
    } catch (error) {
        console.error("Failed to publish AI context:", error);
    }
}

export { EstablishConnection, getChannel, publishResponse, publishNotification, publishAIContextUpdate, HEALTH_QUEUE, HEALTH_RESPONSE_QUEUE, NOTIFICATION_QUEUE, HEALTH_SYNC_QUEUE, AI_CONTEXT_QUEUE, AI_CONTEXT_REQUEST_QUEUE };
