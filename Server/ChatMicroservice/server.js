import express from "express";
import { EstablishConnection, getChannel, publishResponse, CHAT_QUEUE, AI_CONTEXT_QUEUE, AI_CONTEXT_REQUEST_QUEUE, HISTORY_REQUEST_QUEUE } from "./config/Mq.js";
import { createRedisConnection, cacheResponse, getCachedResponse } from "./config/Redis.js";


// Initialize connections
async function initializeServices() {
    try {
        // Connect to RabbitMQ
        await EstablishConnection();
        console.log("RabbitMQ channel established");

        // Connect to Redis
        await createRedisConnection();
        console.log("Redis connection established");

        // Start consuming messages
        consumeChatRequests();
        consumeAIContextUpdates();
        consumeHistoryRequests();
    } catch (error) {
        console.error("Failed to initialize services:", error);
        process.exit(1);
    }
}

// Consume AI context updates
async function consumeAIContextUpdates() {
    const channel = getChannel();
    channel.consume(AI_CONTEXT_QUEUE, async (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            console.log("Received AI context update:", content);

            // Store context in Redis (key: user_context:{userId})
            if (content.userId) {
                const redisKey = `user_context:${content.userId}`;
                // Cache for 24 hours
                await cacheResponse(redisKey, content);
                console.log("Updated AI context for user:", content.userId);
            }

            channel.ack(msg);
        }
    });
}

// MongoDB & Models
import mongoose from 'mongoose';
import { ChatSession } from './models/ChatSession.js';
import { ChatMessage } from './models/ChatMessage.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healify_chat";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// RPC: Request Health Context from System AI
async function requestHealthContext(userId) {
    return new Promise(async (resolve, reject) => {
        const channel = getChannel();
        const correlationId = Math.random().toString() + Math.random().toString() + Math.random().toString();
        const replyTo = await channel.assertQueue('', { exclusive: true });

        console.log("Requesting health context for user:", userId);

        channel.consume(replyTo.queue, (msg) => {
            if (msg && msg.properties.correlationId === correlationId) {
                const content = JSON.parse(msg.content.toString());
                console.log("Received health context response:", content);
                resolve(content.context);
                channel.deleteQueue(replyTo.queue); // Cleanup
            }
        }, { noAck: true });

        channel.sendToQueue(
            AI_CONTEXT_REQUEST_QUEUE,
            Buffer.from(JSON.stringify({ userId, correlationId })),
            { correlationId, replyTo: replyTo.queue }
        );

        // Timeout after 2 seconds
        setTimeout(() => {
            resolve(null); // Return null on timeout
        }, 2000);
    });
}

// RPC Provider: Serve Chat History
async function consumeHistoryRequests() {
    const channel = getChannel();
    channel.consume(HISTORY_REQUEST_QUEUE, async (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            console.log("Received history request:", content);

            const userId = content.userId;

            // Fetch history from MongoDB
            // Get all messages for this user, sorted by time
            const messages = await ChatMessage.find({ userId }).sort({ timestamp: 1 }).limit(50);

            const response = {
                history: messages.map(m => ({
                    id: m._id,
                    author: m.author === 'user' ? 'me' : 'other',
                    text: m.text,
                    timestamp: m.timestamp
                }))
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

import {
    analyzeQueryClarity,
    generateClarificationRequest,
    assessHealthDataQuality,
    generateHealthDataWarning
} from './services/ai-safety.service.js';
import { generateMedicalResponse } from './services/ai-provider.service.js';

// AI Processing function
async function processAIRequest(message, userId, sessionId) {
    console.log(`Processing AI request for user ${userId}: ${message}`);

    // 1. Try to get context from Cache first (fastest)
    const redisKey = `user_context:${userId}`;
    let userContext = await getCachedResponse(redisKey);

    // 2. If not in cache, or to ensure freshness, request from System AI (RPC)
    const systemContext = await requestHealthContext(userId);

    if (systemContext) {
        userContext = { data: systemContext }; // Normalize structure
    }

    // ==========================================
    // AI SAFETY CHECKS
    // ==========================================

    // 3. Analyze Query Clarity
    const clarityScore = analyzeQueryClarity(message);
    console.log(`Query clarity score: ${clarityScore}`);

    if (clarityScore < 0.4) { // Threshold for clarification
        return {
            text: generateClarificationRequest(message),
            confidence: 0.3,
            needsClarification: true,
            metadata: { clarityScore }
        };
    }

    // 4. Assess Health Data Quality
    const healthDataQuality = assessHealthDataQuality(userContext?.data);
    console.log(`Health data quality:`, healthDataQuality);

    // If data is very poor and query depends on it, warn user
    const queryNeedsData = message.toLowerCase().includes('health') ||
        message.toLowerCase().includes('trend') ||
        message.toLowerCase().includes('analysis');

    if (queryNeedsData && (healthDataQuality.completeness < 0.3 || healthDataQuality.stability < 0.4)) {
        // Flag for doctor review automatically due to poor data
        await ChatSession.findOneAndUpdate(
            { sessionId },
            {
                needsDoctorReview: true,
                reviewReason: 'Insufficient health data for analysis',
                healthDataQuality,
                status: 'needs_review'
            }
        );

        return {
            text: generateHealthDataWarning(healthDataQuality),
            confidence: 0.4,
            needsDoctorReview: true,
            metadata: { healthDataQuality }
        };
    }

    // 5. Generate Response via medical-grade AI provider (Infermedica -> OpenAI -> fallback)
    const aiOutput = await generateMedicalResponse(message, userContext?.data);

    const needsDoctorReview = aiOutput.needsDoctorReview || aiOutput.confidence < 0.7;

    if (needsDoctorReview) {
        await ChatSession.findOneAndUpdate(
            { sessionId },
            {
                needsDoctorReview: true,
                reviewReason: 'Low AI confidence or safety flag',
                aiConfidence: aiOutput.confidence,
                healthDataQuality,
                status: 'needs_review'
            }
        );
    }

    return {
        text: aiOutput.text,
        confidence: aiOutput.confidence,
        metadata: {
            clarityScore,
            healthDataQuality,
            provider: aiOutput.source,
            ...aiOutput.metadata,
            needsDoctorReview,
        }
    };
}

// Consume chat requests from queue
async function consumeChatRequests() {
    const channel = getChannel();

    channel.consume(
        CHAT_QUEUE,
        async (msg) => {
            if (msg) {
                try {
                    const request = JSON.parse(msg.content.toString());
                    console.log("Received chat request:", request);

                    const { userId, message, sessionId, timestamp } = request;

                    // 1. Save User Message to MongoDB
                    await ChatMessage.create({
                        sessionId,
                        userId,
                        author: 'user',
                        text: message,
                        timestamp: new Date()
                    });

                    // NOTIFY ASSIGNED DOCTOR
                    try {
                        const session = await ChatSession.findOne({ sessionId });
                        if (session && session.assignedDoctorId) {
                            const doctor = await Doctor.findOne({ doctorId: session.assignedDoctorId });
                            if (doctor) {
                                await notifyDoctor(
                                    doctor,
                                    'New Patient Message',
                                    `Patient #${session.userId.substring(0, 4)}... sent a message`,
                                    { sessionId, type: 'new_message' }
                                );
                            }
                        }
                    } catch (notifError) {
                        console.error("Error sending notification:", notifError);
                    }

                    // 2. Process with AI
                    const aiResponse = await processAIRequest(message, userId, sessionId);

                    // 3. Save AI Response to MongoDB
                    await ChatMessage.create({
                        sessionId,
                        userId,
                        author: 'ai',
                        text: aiResponse.text,
                        timestamp: new Date(),
                        metadata: aiResponse.metadata
                    });

                    // NOTIFY IF FLAGGED FOR REVIEW
                    if (aiResponse.metadata?.needsDoctorReview) {
                        // Logic to notify doctors about new review
                        // For now, we'll log it. In a real app, you might notify all doctors or a triage team.
                        console.log(`Session ${sessionId} flagged for review. Notification logic would go here.`);
                    }

                    // 4. Cache the response in Redis for Main Server polling
                    await cacheResponse(sessionId, {
                        status: 'completed',
                        response: aiResponse.text,
                        metadata: aiResponse.metadata
                    });

                    // Acknowledge message
                    channel.ack(msg);

                    console.log(`Processed request for session ${sessionId}`);
                } catch (error) {
                    console.error("Error processing message:", error);
                    // Reject and requeue the message
                    channel.nack(msg, false, true);
                }
            }
        },
        { noAck: false }
    );

    console.log("Chat microservice is now consuming messages from queue...");
}

// Initialize Express app
const app = express();
app.use(express.json());

// Bookmark endpoints
app.post("/bookmark/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { isBookmarked } = req.body;

        const session = await ChatSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        session.isBookmarked = isBookmarked;
        session.bookmarkedAt = isBookmarked ? new Date() : null;
        session.updatedAt = new Date();
        await session.save();

        console.log(`Session ${sessionId} bookmark status updated to: ${isBookmarked}`);

        res.json({
            success: true,
            message: isBookmarked ? "Session bookmarked" : "Bookmark removed",
            session: {
                sessionId: session.sessionId,
                isBookmarked: session.isBookmarked,
                bookmarkedAt: session.bookmarkedAt
            }
        });
    } catch (error) {
        console.error("Error updating bookmark:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update bookmark",
            error: error.message
        });
    }
});

app.get("/bookmarks/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const bookmarkedSessions = await ChatSession.find({
            userId,
            isBookmarked: true
        }).sort({ bookmarkedAt: -1 });

        // Get first message from each session for preview
        const sessionsWithPreviews = await Promise.all(
            bookmarkedSessions.map(async (session) => {
                const firstMessage = await ChatMessage.findOne({
                    sessionId: session.sessionId,
                    author: 'user'
                }).sort({ timestamp: 1 });

                return {
                    sessionId: session.sessionId,
                    userId: session.userId,
                    status: session.status,
                    isBookmarked: session.isBookmarked,
                    bookmarkedAt: session.bookmarkedAt,
                    createdAt: session.createdAt,
                    preview: firstMessage ? firstMessage.text : 'No messages',
                };
            })
        );

        res.json({
            success: true,
            bookmarks: sessionsWithPreviews,
            count: sessionsWithPreviews.length
        });
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookmarks",
            error: error.message
        });
    }
});

// ============================================
// DOCTOR AUTHENTICATION & REVIEW ENDPOINTS
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Doctor } from './models/Doctor.js';
import { User } from './models/User.js';
import { DoctorMessage } from './models/DoctorMessage.js';
import { generateAnonymousId, anonymizePatientData, anonymizeChatMessages } from './services/anonymization.service.js';
import { notifyDoctor } from './services/notification.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate doctor
async function authenticateDoctor(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const doctor = await Doctor.findOne({ doctorId: decoded.doctorId });

        if (!doctor || !doctor.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        req.doctor = doctor;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Authentication failed' });
    }
}

// Doctor Login
app.post("/doctor/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, doctor.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { doctorId: doctor.doctorId, email: doctor.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
            { doctorId: doctor.doctorId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Save refresh token
        doctor.refreshToken = refreshToken;
        await doctor.save();

        res.json({
            success: true,
            accessToken,
            refreshToken,
            doctor: {
                doctorId: doctor.doctorId,
                email: doctor.email,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialization: doctor.specialization
            }
        });
    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Register Push Token
app.post('/doctor/push-token', authenticateDoctor, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token required' });

        const doctor = await Doctor.findOne({ doctorId: req.doctor.doctorId });
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

        // Add token if not exists
        if (!doctor.pushTokens) doctor.pushTokens = [];
        if (!doctor.pushTokens.includes(token)) {
            doctor.pushTokens.push(token);
            await doctor.save();
        }

        res.json({ success: true, message: 'Push token registered' });
    } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Doctor Registration (for initial setup)
app.post("/doctor/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, specialization, licenseNumber } = req.body;

        // Check if doctor already exists
        const existing = await Doctor.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Doctor already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate doctor ID
        const doctorId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const doctor = await Doctor.create({
            doctorId,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            specialization,
            licenseNumber
        });

        res.json({
            success: true,
            message: 'Doctor registered successfully',
            doctorId: doctor.doctorId
        });
    } catch (error) {
        console.error('Doctor registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Get review queue (ANONYMIZED)
app.get("/doctor/review-queue", authenticateDoctor, async (req, res) => {
    try {
        const sessions = await ChatSession.find({
            needsDoctorReview: true,
            status: { $in: ['needs_review', 'under_review'] }
        })
            .sort({ createdAt: -1 })
            .limit(50);

        const anonymizedSessions = await Promise.all(
            sessions.map(async (session) => {
                const messages = await ChatMessage.find({ sessionId: session.sessionId })
                    .sort({ timestamp: 1 });

                // Anonymize messages
                const anonymizedMessages = anonymizeChatMessages(messages, session.userId);

                return {
                    sessionId: session.sessionId,
                    anonymousPatientId: generateAnonymousId(session.userId),
                    status: session.status,
                    aiConfidence: session.aiConfidence,
                    reviewReason: session.reviewReason,
                    healthDataQuality: session.healthDataQuality,
                    createdAt: session.createdAt,
                    assignedDoctorId: session.assignedDoctorId,
                    messageCount: messages.length,
                    lastMessage: anonymizedMessages[anonymizedMessages.length - 1]
                };
            })
        );

        res.json({ success: true, sessions: anonymizedSessions });
    } catch (error) {
        console.error('Error fetching review queue:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Assign session to doctor
app.post("/doctor/assign/:sessionId", authenticateDoctor, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const doctorId = req.doctor.doctorId;

        const session = await ChatSession.findOneAndUpdate(
            { sessionId },
            {
                assignedDoctorId: doctorId,
                status: 'under_review',
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error assigning session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Doctor sends message to patient
app.post("/doctor/message/:sessionId", authenticateDoctor, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { text } = req.body;
        const doctorId = req.doctor.doctorId;

        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Save doctor message
        const doctorMessage = await DoctorMessage.create({
            sessionId,
            doctorId,
            userId: session.userId,
            text,
            timestamp: new Date()
        });

        // Also save to ChatMessage for continuity
        await ChatMessage.create({
            sessionId,
            userId: session.userId,
            author: 'doctor',
            text,
            timestamp: new Date(),
            metadata: {
                doctorId,
                doctorName: `Dr. ${req.doctor.lastName}`
            }
        });

        res.json({ success: true, message: doctorMessage });
    } catch (error) {
        console.error('Error sending doctor message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark session as reviewed
app.post("/doctor/complete-review/:sessionId", authenticateDoctor, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { notes } = req.body;

        const session = await ChatSession.findOneAndUpdate(
            { sessionId },
            {
                status: 'reviewed',
                reviewedAt: new Date(),
                doctorNotes: notes,
                needsDoctorReview: false
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error completing review:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get session messages (ANONYMIZED)
app.get("/doctor/session-messages/:sessionId", authenticateDoctor, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const messages = await ChatMessage.find({ sessionId })
            .sort({ timestamp: 1 });

        // Anonymize messages
        const anonymizedMessages = anonymizeChatMessages(messages, session.userId);

        res.json({
            success: true,
            messages: anonymizedMessages,
            anonymousPatientId: generateAnonymousId(session.userId)
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get patient health data (ANONYMIZED)
app.get("/doctor/patient-health/:sessionId", authenticateDoctor, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Fetch User Profile
        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get Health Context (from Redis or RPC)
        const redisKey = `user_context:${session.userId}`;
        const userContext = await getCachedResponse(redisKey);
        const healthData = userContext?.data || {};

        // Anonymize Data
        const anonymizedData = anonymizePatientData(user, healthData);

        res.json({
            success: true,
            healthData: anonymizedData
        });
    } catch (error) {
        console.error('Error fetching patient health:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "chat-microservice",
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Chat Microservice listening on port ${PORT}`);
    initializeServices();
});


