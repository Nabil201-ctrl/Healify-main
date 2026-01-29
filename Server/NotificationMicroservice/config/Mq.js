import amqlib from "amqplib";
import dotenv from "dotenv";
import { sendPushNotification } from "./Firebase.js";
dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const NOTIFICATION_QUEUE = "notification_queue";

let connection = null;
let channel = null;

async function EstablishConnection() {
    try {
        console.log("Connecting to RabbitMQ at:", RABBITMQ_URL.replace(/:[^:@]*@/, ':***@'));
        connection = await amqlib.connect(RABBITMQ_URL);

        connection.on("error", (err) => {
            console.error("RabbitMQ connection error:", err);
        });

        connection.on("close", () => {
            console.warn("RabbitMQ connection closed");
        });

        channel = await connection.createChannel();

        // Assert queue
        await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

        console.log("Connected to RabbitMQ and notification queue asserted");
        return channel;
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
        // Retry logic could go here
        setTimeout(EstablishConnection, 5000);
    }
}

function getChannel() {
    return channel;
}

async function consumeNotifications() {
    if (!channel) {
        console.warn("Channel not ready, retrying consume...");
        setTimeout(consumeNotifications, 1000);
        return;
    }

    const currentChannel = getChannel();

    currentChannel.consume(
        NOTIFICATION_QUEUE,
        async (msg) => {
            if (msg) {
                const notification = JSON.parse(msg.content.toString());
                console.log("Received notification:", notification);

                const { tokens, token, type, message, timestamp, title } = notification;
                const targetTokens = Array.isArray(tokens)
                    ? tokens.filter(Boolean)
                    : token
                        ? [token]
                        : [];

                if (!targetTokens.length) {
                    console.warn("No target tokens provided for notification payload; skipping", notification);
                    currentChannel.ack(msg);
                    return;
                }

                for (const pushToken of targetTokens) {
                    try {
                        await sendPushNotification(
                            pushToken,
                            title || "Healify Alert",
                            message,
                            { type, timestamp }
                        );
                    } catch (err) {
                        console.error("Failed to send push notification:", err);
                    }
                }

                currentChannel.ack(msg);
            }
        },
        { noAck: false }
    );

    console.log("Notification microservice is now consuming messages from queue...");
}

export { EstablishConnection, getChannel, consumeNotifications, NOTIFICATION_QUEUE };
