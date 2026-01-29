import amqlib from "amqplib";
import dotenv from "dotenv"
dotenv.config()

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const CHAT_QUEUE = "chat_requests";
const RESPONSE_QUEUE = "chat_responses";
const AI_CONTEXT_QUEUE = "ai_context_update";
const AI_CONTEXT_REQUEST_QUEUE = "ai_context_request";
const HISTORY_REQUEST_QUEUE = "chat_history_request";

let connection = null;
let channel = null;

async function EstablishConnection() {
    try {
        connection = await amqlib.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        // Assert both queues
        await channel.assertQueue(CHAT_QUEUE, { durable: true });
        await channel.assertQueue(RESPONSE_QUEUE, { durable: true });
        await channel.assertQueue(AI_CONTEXT_QUEUE, { durable: true });
        await channel.assertQueue(AI_CONTEXT_REQUEST_QUEUE, { durable: true });
        await channel.assertQueue(HISTORY_REQUEST_QUEUE, { durable: true });

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
            RESPONSE_QUEUE,
            Buffer.from(JSON.stringify(response)),
            { persistent: true }
        );
        console.log("Response published to queue:", response.sessionId);
    } catch (error) {
        console.error("Failed to publish response:", error);
        throw error;
    }
}

export { EstablishConnection, getChannel, publishResponse, CHAT_QUEUE, RESPONSE_QUEUE, AI_CONTEXT_QUEUE, AI_CONTEXT_REQUEST_QUEUE, HISTORY_REQUEST_QUEUE };