import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Doctor, DoctorDocument } from '../entities/doctor.entity';
import {
    DoctorMessage,
    DoctorMessageDocument,
} from '../entities/doctor-message.entity';
import {
    ChatSession,
    ChatSessionDocument,
} from '../entities/chat-session.entity';
import {
    ChatMessage,
    ChatMessageDocument,
} from '../entities/chat-message.entity';
import {
    generateAnonymousId,
    anonymizePatientData,
    anonymizeChatMessages,
} from '../utils/anonymization.util';

@Injectable()
export class DoctorService {
    private readonly logger = new Logger(DoctorService.name);
    private readonly JWT_SECRET =
        process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    constructor(
        @InjectModel(Doctor.name)
        private doctorModel: Model<DoctorDocument>,
        @InjectModel(DoctorMessage.name)
        private doctorMessageModel: Model<DoctorMessageDocument>,
        @InjectModel(ChatSession.name)
        private chatSessionModel: Model<ChatSessionDocument>,
        @InjectModel(ChatMessage.name)
        private chatMessageModel: Model<ChatMessageDocument>,
    ) { }

    // ─── Authentication ─────────────────────────────────────────────────────────

    async login(
        email: string,
        password: string,
    ): Promise<{
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
        doctor?: any;
        message?: string;
    }> {
        const doctor = await this.doctorModel.findOne({ email });
        if (!doctor) {
            return { success: false, message: 'Invalid credentials' };
        }

        const isValidPassword = await bcrypt.compare(password, doctor.password);
        if (!isValidPassword) {
            return { success: false, message: 'Invalid credentials' };
        }

        const accessToken = jwt.sign(
            { doctorId: doctor.doctorId, email: doctor.email },
            this.JWT_SECRET,
            { expiresIn: '24h' },
        );

        const refreshToken = jwt.sign(
            { doctorId: doctor.doctorId },
            this.JWT_SECRET,
            { expiresIn: '7d' },
        );

        doctor.refreshToken = refreshToken;
        await doctor.save();

        return {
            success: true,
            accessToken,
            refreshToken,
            doctor: {
                doctorId: doctor.doctorId,
                email: doctor.email,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialization: doctor.specialization,
            },
        };
    }

    async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        specialization?: string;
        licenseNumber: string;
    }): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; doctor?: any; message?: string }> {
        const existing = await this.doctorModel.findOne({ email: data.email });
        if (existing) {
            return { success: false, message: 'An account with this email already exists' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const doctorId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const accessToken = jwt.sign(
            { doctorId, email: data.email },
            this.JWT_SECRET,
            { expiresIn: '24h' },
        );

        const refreshToken = jwt.sign(
            { doctorId },
            this.JWT_SECRET,
            { expiresIn: '7d' },
        );

        const doctor = await this.doctorModel.create({
            doctorId,
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            specialization: data.specialization,
            licenseNumber: data.licenseNumber,
            refreshToken,
        });

        return {
            success: true,
            accessToken,
            refreshToken,
            doctor: {
                doctorId: doctor.doctorId,
                email: doctor.email,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialization: doctor.specialization,
            },
        };
    }


    async verifyToken(
        token: string,
    ): Promise<DoctorDocument | null> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as any;
            const doctor = await this.doctorModel.findOne({
                doctorId: decoded.doctorId,
            });
            if (!doctor || !doctor.isActive) return null;
            return doctor;
        } catch {
            return null;
        }
    }

    async registerPushToken(
        doctorId: string,
        token: string,
    ): Promise<{ success: boolean; message: string }> {
        const doctor = await this.doctorModel.findOne({ doctorId });
        if (!doctor) return { success: false, message: 'Doctor not found' };

        if (!doctor.pushTokens) doctor.pushTokens = [];
        if (!doctor.pushTokens.includes(token)) {
            doctor.pushTokens.push(token);
            await doctor.save();
        }

        return { success: true, message: 'Push token registered' };
    }

    // ─── Review Queue ───────────────────────────────────────────────────────────

    async getReviewQueue(): Promise<any[]> {
        const sessions = await this.chatSessionModel
            .find({
                needsDoctorReview: true,
                status: { $in: ['needs_review', 'under_review'] },
            })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const anonymizedSessions = await Promise.all(
            sessions.map(async (session: any) => {
                const messages = await this.chatMessageModel
                    .find({ sessionId: session.sessionId })
                    .sort({ timestamp: 1 })
                    .lean();

                const anonymizedMessages = anonymizeChatMessages(
                    messages,
                    session.userId,
                );

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
                    lastMessage:
                        anonymizedMessages[anonymizedMessages.length - 1] || null,
                };
            }),
        );

        return anonymizedSessions;
    }

    async assignSession(
        sessionId: string,
        doctorId: string,
    ): Promise<any | null> {
        return this.chatSessionModel.findOneAndUpdate(
            { sessionId },
            {
                assignedDoctorId: doctorId,
                status: 'under_review',
                updatedAt: new Date(),
            },
            { new: true },
        );
    }

    async sendDoctorMessage(
        sessionId: string,
        doctorId: string,
        doctorLastName: string,
        text: string,
    ): Promise<any> {
        const session = await this.chatSessionModel.findOne({ sessionId });
        if (!session) return null;

        const doctorMessage = await this.doctorMessageModel.create({
            sessionId,
            doctorId,
            userId: session.userId,
            text,
            timestamp: new Date(),
        });

        await this.chatMessageModel.create({
            sessionId,
            userId: session.userId,
            author: 'doctor',
            text,
            timestamp: new Date(),
            metadata: {
                doctorId,
                doctorName: `Dr. ${doctorLastName}`,
            },
        });

        return doctorMessage;
    }

    async completeReview(
        sessionId: string,
        notes: string,
    ): Promise<any | null> {
        return this.chatSessionModel.findOneAndUpdate(
            { sessionId },
            {
                status: 'reviewed',
                reviewedAt: new Date(),
                doctorNotes: notes,
                needsDoctorReview: false,
            },
            { new: true },
        );
    }

    async getSessionMessagesAnonymized(sessionId: string): Promise<any | null> {
        const session = await this.chatSessionModel
            .findOne({ sessionId })
            .lean();
        if (!session) return null;

        const messages = await this.chatMessageModel
            .find({ sessionId })
            .sort({ timestamp: 1 })
            .lean();

        const anonymizedMessages = anonymizeChatMessages(
            messages,
            (session as any).userId,
        );

        return {
            messages: anonymizedMessages,
            anonymousPatientId: generateAnonymousId((session as any).userId),
        };
    }

    async getPatientHealthAnonymized(
        sessionId: string,
        userFinder: (userId: string) => Promise<any>,
    ): Promise<any | null> {
        const session = await this.chatSessionModel
            .findOne({ sessionId })
            .lean();
        if (!session) return null;

        const user = await userFinder((session as any).userId);
        if (!user) return null;

        const healthData = {};
        return anonymizePatientData(user, healthData);
    }

    // ─── Live Doctor Chat ────────────────────────────────────────────────────────

    /** Return publicly visible info for all active doctors */
    async getAvailableDoctors(): Promise<any[]> {
        const doctors = await this.doctorModel
            .find({ isActive: true })
            .select('doctorId firstName lastName specialization')
            .lean();

        // For each doctor, check if they have an active live chat (connected) to show availability
        const withStatus = await Promise.all(
            doctors.map(async (doc: any) => {
                const activeChatCount = await this.chatSessionModel.countDocuments({
                    requestedDoctorId: doc.doctorId,
                    liveChatStatus: 'connected',
                });
                return {
                    doctorId: doc.doctorId,
                    firstName: doc.firstName,
                    lastName: doc.lastName,
                    specialization: doc.specialization || 'General Practitioner',
                    // Considered busy if they already have 3+ active live chats
                    isAvailable: activeChatCount < 3,
                    activeChatCount,
                };
            }),
        );

        return withStatus;
    }

    /** Create a live chat session requesting a specific doctor */
    async requestLiveChat(userId: string, doctorId: string): Promise<any> {
        const doctor = await this.doctorModel.findOne({ doctorId, isActive: true });
        if (!doctor) throw new Error('Doctor not found or unavailable');

        const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session = await this.chatSessionModel.create({
            sessionId,
            userId,
            status: 'live_chat',
            isLiveChat: true,
            requestedDoctorId: doctorId,
            liveChatStatus: 'waiting',
            title: `Live Chat with Dr. ${doctor.lastName}`,
        });

        // Add a system message
        await this.chatMessageModel.create({
            sessionId,
            userId,
            author: 'ai',
            text: `Your request has been sent to Dr. ${doctor.firstName} ${doctor.lastName}. Please wait while they connect…`,
            timestamp: new Date(),
        });

        return {
            sessionId,
            status: 'waiting',
            doctor: {
                doctorId: doctor.doctorId,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialization: doctor.specialization,
            },
        };
    }

    /** Get live chat session status + messages for the user (polling) */
    async getLiveChatSession(sessionId: string, userId: string): Promise<any | null> {
        const session = await this.chatSessionModel.findOne({
            sessionId,
            userId,
            isLiveChat: true,
        }).lean();

        if (!session) return null;

        const messages = await this.chatMessageModel
            .find({ sessionId })
            .sort({ timestamp: 1 })
            .lean();

        let doctorName: string | undefined;
        if ((session as any).requestedDoctorId) {
            const doc = await this.doctorModel.findOne({
                doctorId: (session as any).requestedDoctorId,
            }).select('firstName lastName').lean() as any;
            if (doc) doctorName = `${doc.firstName} ${doc.lastName}`;
        }

        return {
            status: (session as any).liveChatStatus || 'waiting',
            doctorName,
            messages: messages.map((m: any) => ({
                id: m._id.toString(),
                author: m.author,
                text: m.text,
                timestamp: m.timestamp,
                doctorName: m.metadata?.doctorName,
            })),
        };
    }

    /** User sends a message in a live chat session */
    async addUserMessageToLiveChat(sessionId: string, userId: string, text: string): Promise<void> {
        const session = await this.chatSessionModel.findOne({
            sessionId,
            userId,
            isLiveChat: true,
            liveChatStatus: 'connected',
        });
        if (!session) throw new Error('Session not found or not connected');

        await this.chatMessageModel.create({
            sessionId,
            userId,
            author: 'user',
            text,
            timestamp: new Date(),
        });
    }

    // ─── Doctor-side live chat ────────────────────────────────────────────────────

    /** Get all live chat requests for a doctor (their personal queue) */
    async getDoctorLiveChats(doctorId: string): Promise<any[]> {
        const sessions = await this.chatSessionModel
            .find({
                requestedDoctorId: doctorId,
                isLiveChat: true,
                liveChatStatus: { $in: ['waiting', 'connected'] },
            })
            .sort({ createdAt: -1 })
            .lean();

        const result = await Promise.all(
            sessions.map(async (session: any) => {
                const messages = await this.chatMessageModel
                    .find({ sessionId: session.sessionId })
                    .sort({ timestamp: 1 })
                    .lean() as any[];

                const last = messages[messages.length - 1];
                return {
                    sessionId: session.sessionId,
                    anonymousPatientId: generateAnonymousId(session.userId),
                    status: session.liveChatStatus,
                    createdAt: session.createdAt,
                    messageCount: messages.length,
                    lastMessage: last ? last.text : null,
                };
            }),
        );

        return result;
    }

    /** Doctor accepts a waiting live chat */
    async acceptLiveChat(sessionId: string, doctorId: string): Promise<any> {
        const session = await this.chatSessionModel.findOneAndUpdate(
            { sessionId, requestedDoctorId: doctorId, liveChatStatus: 'waiting' },
            {
                liveChatStatus: 'connected',
                assignedDoctorId: doctorId,
                liveChatStartedAt: new Date(),
            },
            { new: true },
        );
        if (!session) throw new Error('Session not found or already accepted');

        // Notify the patient
        const doctor = await this.doctorModel
            .findOne({ doctorId })
            .select('firstName lastName')
            .lean() as any;

        await this.chatMessageModel.create({
            sessionId,
            userId: session.userId,
            author: 'ai',
            text: `Dr. ${doctor?.firstName} ${doctor?.lastName} has joined the chat. You may now send your messages.`,
            timestamp: new Date(),
            metadata: { event: 'doctor_connected' },
        });

        return { sessionId, status: 'connected' };
    }

    /** Doctor sends a message in a live chat */
    async addDoctorMessageToLiveChat(
        sessionId: string,
        doctorId: string,
        text: string,
    ): Promise<void> {
        const session = await this.chatSessionModel.findOne({
            sessionId,
            requestedDoctorId: doctorId,
            isLiveChat: true,
            liveChatStatus: 'connected',
        });
        if (!session) throw new Error('Session not found or not connected');

        const doctor = await this.doctorModel
            .findOne({ doctorId })
            .select('firstName lastName')
            .lean() as any;

        await this.chatMessageModel.create({
            sessionId,
            userId: session.userId,
            author: 'doctor',
            text,
            timestamp: new Date(),
            metadata: {
                doctorId,
                doctorName: `${doctor?.firstName} ${doctor?.lastName}`,
            },
        });
    }

    /** Doctor or system ends a live chat */
    async endLiveChat(sessionId: string, doctorId: string): Promise<void> {
        await this.chatSessionModel.findOneAndUpdate(
            { sessionId, requestedDoctorId: doctorId, isLiveChat: true },
            {
                liveChatStatus: 'ended',
                liveChatEndedAt: new Date(),
                status: 'completed',
            },
        );

        await this.chatMessageModel.create({
            sessionId,
            userId: 'system',
            author: 'ai',
            text: 'The consultation has ended. Thank you for using Healify.',
            timestamp: new Date(),
        });
    }
}
