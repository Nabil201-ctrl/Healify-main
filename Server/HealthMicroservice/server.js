import express from 'express';
import cors from 'cors';
import dotenv from "dotenv"
dotenv.config()
import { EstablishConnection, getChannel, publishResponse, publishNotification, publishAIContextUpdate, HEALTH_QUEUE, HEALTH_SYNC_QUEUE, AI_CONTEXT_REQUEST_QUEUE } from './config/Mq.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';

const app = express();
let PORT = process.env.PORT || 3002;
if (PORT == 3001) {
    console.warn("Port 3001 is reserved for ChatMicroservice. Switching to 3002.");
    PORT = 3002;
}

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// MongoDB & Models
import mongoose from 'mongoose';
import { HealthLog } from './models/HealthLog.js';
import { Insight } from './models/Insight.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healify";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// ─────────────────────────────────────────────
// Data builders: read from MongoDB, not memory
// ─────────────────────────────────────────────

/**
 * Build activity data (steps) from the last 7 HealthLog records for a user.
 * Returns a chart-friendly structure matching the frontend's HealthService interfaces.
 */
async function buildActivityData(userId) {
    const logs = await HealthLog.find({ userId }).sort({ date: -1 }).limit(7).lean();
    if (!logs || logs.length === 0) {
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: [6200, 7500, 5800, 8100, 7200, 8500, 6800] }],
            summary: {
                dailyAvg: 7157,
                weeklyTotal: 50100,
                goal: 10000,
            },
        };
    }

    const ordered = logs.reverse(); // oldest → newest

    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labels = ordered.length
        ? ordered.map(l => {
            const d = new Date(l.date);
            return DAY_LABELS[d.getDay()] || l.date;
        })
        : DAY_LABELS;

    const stepValues = ordered.map(l => l.steps || 0);
    const dailyAvg = stepValues.length
        ? Math.round(stepValues.reduce((a, b) => a + b, 0) / stepValues.length)
        : 0;
    const weeklyTotal = stepValues.reduce((a, b) => a + b, 0);

    return {
        labels: labels.length === 7 ? labels : DAY_LABELS,
        datasets: [{ data: stepValues.length === 7 ? stepValues : new Array(7).fill(0) }],
        summary: {
            dailyAvg,
            weeklyTotal,
            goal: 10000,
        },
    };
}

/**
 * Build heart rate data from the last 7 HealthLog records.
 */
async function buildHeartRateData(userId) {
    const logs = await HealthLog.find({ userId }).sort({ date: -1 }).limit(7).lean();
    if (!logs || logs.length === 0) {
        return {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
            datasets: [{ data: [65, 58, 72, 85, 78, 68] }],
            stats: { min: 58, avg: 71, max: 85, resting: 62 },
        };
    }

    const ordered = logs.reverse();
    const TIME_LABELS = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
    const hrValues = ordered.map(l => l.heartRate || 0).filter(v => v > 0);

    const avg = hrValues.length
        ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
        : 0;
    const min = hrValues.length ? Math.min(...hrValues) : 0;
    const max = hrValues.length ? Math.max(...hrValues) : 0;

    const chartData = hrValues.length >= 6
        ? hrValues.slice(0, 6)
        : new Array(6).fill(avg || 0);

    return {
        labels: TIME_LABELS,
        datasets: [{ data: chartData }],
        stats: {
            min,
            avg,
            max,
            resting: min || avg,
        },
    };
}

/**
 * Build sleep data from the last 7 HealthLog records.
 */
async function buildSleepData(userId) {
    const logs = await HealthLog.find({ userId }).sort({ date: -1 }).limit(7).lean();
    if (!logs || logs.length === 0) {
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [
                [5.1, 1.2, 0.8],
                [4.8, 1.5, 0.9],
                [5.5, 1.0, 1.0],
                [4.2, 1.8, 0.5],
                [6.0, 1.2, 1.2],
                [4.5, 1.5, 0.8],
                [5.2, 1.4, 0.9]
            ],
            lastNight: {
                duration: '7h 30m',
                quality: 'Good',
                bedtime: '10:45 PM',
            },
        };
    }

    const ordered = logs.reverse();
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labels = ordered.length
        ? ordered.map(l => { const d = new Date(l.date); return DAY_LABELS[d.getDay()] || l.date; })
        : DAY_LABELS;

    const data = ordered.map(l => {
        const total = l.sleep || 0;
        const deep = parseFloat((total * 0.7).toFixed(1));
        const light = parseFloat((total * 0.2).toFixed(1));
        const rem = parseFloat((total * 0.1).toFixed(1));
        return [deep, light, rem];
    });

    const lastLog = ordered[ordered.length - 1];
    const lastSleep = lastLog?.sleep || 0;
    const hrs = Math.floor(lastSleep);
    const mins = Math.round((lastSleep - hrs) * 60);

    return {
        labels: labels.length === 7 ? labels : DAY_LABELS,
        data: data.length === 7 ? data : new Array(7).fill([0, 0, 0]),
        lastNight: {
            duration: lastSleep > 0 ? `${hrs}h ${mins}m` : 'No data',
            quality: lastSleep >= 7 ? 'Good' : lastSleep >= 5 ? 'Fair' : lastSleep > 0 ? 'Poor' : 'No data',
            bedtime: '11:00 PM',
        },
    };
}

/**
 * Build quick stats from the most recent HealthLog.
 */
async function buildQuickStats(userId) {
    const latest = await HealthLog.findOne({ userId }).sort({ date: -1 }).lean();
    if (!latest) {
        return {
            distance: '4.2 km',
            activeTime: '2.5 h',
            floors: '12',
            stress: 'Low',
            recovery: '78%',
        };
    }

    const steps = latest?.steps || 0;
    const distanceKm = steps > 0 ? parseFloat((steps * 0.0008).toFixed(1)) : 0;
    const activeTimeHrs = steps > 0 ? parseFloat((steps / 3000).toFixed(1)) : 0;

    return {
        distance: distanceKm > 0 ? `${distanceKm} km` : '0 km',
        activeTime: activeTimeHrs > 0 ? `${activeTimeHrs} h` : '0 h',
        floors: '0',
        stress: 'Normal',
        recovery: '90%',
    };
}

/**
 * Build insights from MongoDB Insight documents for the user.
 */
async function buildInsights(userId) {
    const insights = await Insight.find({ userId }).sort({ timestamp: -1 }).limit(5).lean();

    if (!insights || insights.length === 0) {
        return [{
            label: 'Great Activity',
            text: "You're 15% more active than last week. Keep it up!",
            type: 'positive',
        }, {
            label: 'Hydration',
            text: "Don't forget to drink water today. Target: 2L.",
            type: 'info',
        }];
    }

    return insights.map(i => ({
        label: i.type.replace(/_/g, ' '),
        text: i.message,
        type: i.severity === 'WARNING' ? 'warning' : i.severity === 'CRITICAL' ? 'warning' : 'info',
    }));
}

// ─────────────────────────────────────────────
// System AI: Analyze and Store
// ─────────────────────────────────────────────
async function analyzeAndStore(data) {
    const today = new Date().toISOString().split('T')[0];
    const userId = data.userId || "default_user";

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
    const history = await HealthLog.find({ userId }).sort({ date: -1 }).limit(5);
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

// ─────────────────────────────────────────────
// RabbitMQ Consumers
// ─────────────────────────────────────────────

// RPC Provider: Respond to Chat AI context requests
async function consumeContextRequests() {
    const channel = getChannel();
    channel.consume(AI_CONTEXT_REQUEST_QUEUE, async (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            console.log("Received context request:", content);

            const userId = content.userId || "default_user";
            const today = new Date().toISOString().split('T')[0];

            // Fetch latest data from MongoDB
            const log = await HealthLog.findOne({ userId, date: today });
            const insights = await Insight.find({ userId }).sort({ timestamp: -1 }).limit(3);

            const response = {
                correlationId: content.correlationId,
                context: {
                    current: log ? { heartRate: log.heartRate, steps: log.steps } : {},
                    insights: insights.map(i => i.message)
                }
            };

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

                // System AI Analysis & persist to MongoDB
                const { log, insights } = await analyzeAndStore(content);

                // Publish to AI Context (Push update)
                await publishAIContextUpdate({
                    userId: content.userId || "default_user",
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
                        userId: content.userId || "default_user",
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

                    const { type, correlationId, userId } = request;
                    const resolvedUserId = userId || "default_user";
                    let data;

                    switch (type) {
                        case 'activity':
                            data = await buildActivityData(resolvedUserId);
                            break;
                        case 'heart-rate':
                            data = await buildHeartRateData(resolvedUserId);
                            // Check for abnormal heart rate
                            if (data.stats && data.stats.avg > 100) {
                                console.log("High heart rate detected! Sending notification...");
                                await publishNotification({
                                    userId: resolvedUserId,
                                    type: "HIGH_HEART_RATE",
                                    message: `Warning: Your average heart rate is high (${data.stats.avg} bpm). Please rest.`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            break;
                        case 'sleep':
                            data = await buildSleepData(resolvedUserId);
                            break;
                        case 'quick-stats':
                            data = await buildQuickStats(resolvedUserId);
                            break;
                        case 'insights':
                            data = await buildInsights(resolvedUserId);
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
                    if (msg.content) {
                        try {
                            const request = JSON.parse(msg.content.toString());
                            await publishResponse({
                                correlationId: request.correlationId,
                                error: error.message,
                                timestamp: new Date().toISOString()
                            });
                            channel.ack(msg);
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

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check service health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
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
