import express from 'express';
import cors from 'cors';
import dotenv from "dotenv"
dotenv.config()
import { EstablishConnection, getChannel, publishResponse, publishNotification, publishAIContextUpdate, HEALTH_QUEUE, HEALTH_SYNC_QUEUE, AI_CONTEXT_REQUEST_QUEUE } from './config/Mq.js';

const app = express();
let PORT = process.env.PORT || 3002;
if (PORT == 3001) {
    console.warn("Port 3001 is reserved for ChatMicroservice. Switching to 3002.");
    PORT = 3002;
}

app.use(cors());
app.use(express.json());

// Mock Data
const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
        {
            data: [65, 78, 82, 75, 90, 45, 60],
        },
    ],
    summary: {
        dailyAvg: 71,
        weeklyTotal: 495,
        goal: 60
    }
};

const heartRateData = {
    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
    datasets: [
        {
            data: [68, 72, 75, 78, 72, 68],
        },
    ],
    stats: {
        min: 68,
        avg: 105,
        max: 120,
        resting: 65
    }
};

const sleepData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [
        [6, 1.5, 0.5], // Deep, Light, REM
        [5.5, 2, 0.5],
        [7, 1, 0.5],
        [6.5, 1.5, 0.5],
        [5, 2.5, 0.5],
        [8, 1, 1],
        [7.5, 1, 0.5],
    ],
    lastNight: {
        duration: '7h 30m',
        quality: '85%',
        bedtime: '10:45 PM'
    }
};

// RabbitMQ Consumer
// MongoDB & Models
import mongoose from 'mongoose';
import { HealthLog } from './models/HealthLog.js';
import { Insight } from './models/Insight.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healify";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// System AI: Analyze and Store
async function analyzeAndStore(data) {
    const today = new Date().toISOString().split('T')[0];
    const userId = "user_123"; // Mock user ID

    // 1. Store/Update Health Log
    let log = await HealthLog.findOne({ userId, date: today });
    if (!log) {
        log = new HealthLog({ userId, date: today });
    }
    if (data.heartRate) log.heartRate = data.heartRate;
    if (data.steps) log.steps = data.steps;
    if (data.sleep) log.sleep = data.sleep;
    await log.save();

    // 2. Analyze (Compare with history)
    const history = await HealthLog.find({ userId }).sort({ date: -1 }).limit(5); // Get last 5 days
    let insights = [];

    if (history.length > 1) {
        const yesterday = history.find(h => h.date !== today);
        if (yesterday) {
            if (data.heartRate && yesterday.heartRate && data.heartRate > yesterday.heartRate + 10) {
                const msg = `Heart rate is significantly higher than yesterday (${yesterday.heartRate} bpm).`;
                insights.push(msg);
                await Insight.create({ userId, date: today, type: 'HEART_RATE_TREND', message: msg, severity: 'WARNING' });
            }
            if (data.steps && yesterday.steps && data.steps < yesterday.steps / 2) {
                const msg = `Activity level is much lower than yesterday.`;
                insights.push(msg);
                await Insight.create({ userId, date: today, type: 'ACTIVITY_DROP', message: msg, severity: 'INFO' });
            }
        }
    }

    return { log, insights };
}

// RPC Provider: Respond to Chat AI context requests
async function consumeContextRequests() {
    const channel = getChannel();
    channel.consume(AI_CONTEXT_REQUEST_QUEUE, async (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            console.log("Received context request:", content);

            const userId = content.userId || "user_123";
            const today = new Date().toISOString().split('T')[0];

            // Fetch latest data
            const log = await HealthLog.findOne({ userId, date: today });
            const insights = await Insight.find({ userId }).sort({ timestamp: -1 }).limit(3);

            const response = {
                correlationId: content.correlationId,
                context: {
                    current: log ? { heartRate: log.heartRate, steps: log.steps } : {},
                    insights: insights.map(i => i.message)
                }
            };

            // Send response back to the reply queue
            channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(JSON.stringify(response)),
                { correlationId: msg.properties.correlationId }
            );

            channel.ack(msg);
        }
    });
}

async function consumeHealthSync() {
    try {
        const channel = getChannel();
        console.log("Waiting for health sync data...");
        channel.consume(HEALTH_SYNC_QUEUE, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log("Received health sync data:", content);

                // Update in-memory data (keep for legacy/fast access if needed)
                if (content.heartRate) heartRateData.stats.avg = content.heartRate;
                if (content.steps) {
                    activityData.summary.dailyAvg = Math.round(content.steps / 20);
                    activityData.summary.weeklyTotal += Math.round(content.steps / 20);
                }

                // System AI Analysis
                const { log, insights } = await analyzeAndStore(content);

                // Publish to AI Context (Push update)
                await publishAIContextUpdate({
                    userId: "user_123",
                    type: "HEALTH_UPDATE",
                    data: {
                        current: { heartRate: log.heartRate, steps: log.steps },
                        insights: insights
                    },
                    timestamp: new Date().toISOString()
                });

                // Check for abnormal heart rate (Notification)
                if (content.heartRate > 100) {
                    console.log("High heart rate detected! Sending notification...");
                    await publishNotification({
                        userId: "user_123",
                        type: "HIGH_HEART_RATE",
                        message: `Warning: Your average heart rate is high (${content.heartRate} bpm). Please rest.`,
                        timestamp: new Date().toISOString()
                    });
                }

                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Error consuming health sync:", error);
    }
}

async function consumeHealthRequests() {
    const channel = getChannel();

    channel.consume(
        HEALTH_QUEUE,
        async (msg) => {
            if (msg) {
                try {
                    const request = JSON.parse(msg.content.toString());
                    console.log("Received health request:", request);

                    const { type, correlationId } = request;
                    let data;

                    switch (type) {
                        case 'activity':
                            data = activityData;
                            break;
                        case 'heart-rate':
                            data = heartRateData;
                            // Check for abnormal heart rate
                            if (data.stats && data.stats.avg > 100) {
                                console.log("High heart rate detected! Sending notification...");
                                await publishNotification({
                                    userId: "user_123", // Mock user ID
                                    type: "HIGH_HEART_RATE",
                                    message: `Warning: Your average heart rate is high (${data.stats.avg} bpm). Please rest.`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            break;
                        case 'sleep':
                            data = sleepData;
                            break;
                        default:
                            throw new Error(`Unknown health data type: ${type}`);
                    }

                    const response = {
                        correlationId,
                        data,
                        timestamp: new Date().toISOString()
                    };

                    await publishResponse(response);
                    channel.ack(msg);

                } catch (error) {
                    console.error("Error processing health request:", error);
                    // Send error response if possible, or just nack
                    if (msg.content) {
                        try {
                            const request = JSON.parse(msg.content.toString());
                            await publishResponse({
                                correlationId: request.correlationId,
                                error: error.message,
                                timestamp: new Date().toISOString()
                            });
                            channel.ack(msg); // Ack because we handled the error
                        } catch (e) {
                            channel.nack(msg, false, false);
                        }
                    } else {
                        channel.nack(msg, false, false);
                    }
                }
            }
        },
        { noAck: false }
    );

    console.log("Health microservice is consuming messages...");
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'health-microservice' });
});

app.listen(PORT, async () => {
    console.log(`Health Microservice listening on port ${PORT}`);
    try {
        await EstablishConnection();
        // Start consuming
        consumeHealthRequests();
        consumeHealthSync();
        consumeContextRequests();
    } catch (error) {
        console.error("Failed to initialize RabbitMQ:", error);
    }
});
