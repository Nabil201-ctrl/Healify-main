import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    ChatSession,
    ChatSessionDocument,
} from '../entities/chat-session.entity';
import {
    ChatMessage,
    ChatMessageDocument,
} from '../entities/chat-message.entity';
import { AiProviderService } from './ai-provider.service';
import { HealthProcessorService } from '../../health/services/health-processor.service';
import {
    analyzeQueryClarity,
    generateClarificationRequest,
    assessHealthDataQuality,
    generateHealthDataWarning,
} from '../utils/ai-safety.util';

@Injectable()
export class ChatProcessorService {
    private readonly logger = new Logger(ChatProcessorService.name);

    constructor(
        @InjectModel(ChatSession.name)
        private chatSessionModel: Model<ChatSessionDocument>,
        @InjectModel(ChatMessage.name)
        private chatMessageModel: Model<ChatMessageDocument>,
        private readonly aiProviderService: AiProviderService,
        private readonly healthProcessorService: HealthProcessorService,
    ) { }

    // ─── Send & Process a Chat Message ──────────────────────────────────────────

    async processChat(
        userId: string,
        message: string,
        sessionId: string,
    ): Promise<{
        sessionId: string;
        response: string;
        metadata?: any;
    }> {
        // 1. Save user message
        await this.chatMessageModel.create({
            sessionId,
            userId,
            author: 'user',
            text: message,
            timestamp: new Date(),
        });

        // 2. Update or create session
        let session = await this.chatSessionModel.findOne({ sessionId });
        if (session) {
            (session as any).updatedAt = new Date();
            if (session.title === 'New Chat' || !session.title) {
                let newTitle = message.substring(0, 30);
                if (message.length > 30) newTitle += '...';
                session.title = newTitle;
            }
            await session.save();
        } else {
            let title = message.substring(0, 30);
            if (message.length > 30) title += '...';
            await this.chatSessionModel.create({
                sessionId,
                userId,
                title,
                updatedAt: new Date(),
            });
        }

        // 3. Process with AI
        const aiResponse = await this.processAIRequest(message, userId, sessionId);

        // 4. Save AI response
        await this.chatMessageModel.create({
            sessionId,
            userId,
            author: 'ai',
            text: aiResponse.text,
            timestamp: new Date(),
            metadata: aiResponse.metadata,
        });

        // 5. Update session with AI response
        await this.chatSessionModel.findOneAndUpdate(
            { sessionId },
            {
                status: 'completed',
                aiResponse: aiResponse.text,
                aiMetadata: aiResponse.metadata,
                completedAt: new Date(),
            },
        );

        return {
            sessionId,
            response: aiResponse.text,
            metadata: aiResponse.metadata,
        };
    }

    // ─── AI Processing ──────────────────────────────────────────────────────────

    private async processAIRequest(
        message: string,
        userId: string,
        sessionId: string,
    ): Promise<{
        text: string;
        confidence: number;
        metadata: any;
    }> {
        this.logger.log(`Processing AI request for user ${userId}`);

        // 1. Fetch health context directly from DB (no more RPC)
        let userContext: any = null;
        const healthContext =
            await this.healthProcessorService.getHealthContext(userId);
        if (healthContext) {
            userContext = { data: healthContext };
        }

        // 2. Analyze Query Clarity
        const clarityScore = analyzeQueryClarity(message);
        this.logger.log(`Query clarity score: ${clarityScore}`);

        if (clarityScore < 0.4) {
            return {
                text: generateClarificationRequest(message),
                confidence: 0.3,
                metadata: { clarityScore, needsClarification: true },
            };
        }

        // 3. Assess Health Data Quality
        const healthDataQuality = assessHealthDataQuality(userContext?.data);
        this.logger.log(`Health data quality: ${JSON.stringify(healthDataQuality)}`);

        const queryNeedsData =
            message.toLowerCase().includes('health') ||
            message.toLowerCase().includes('trend') ||
            message.toLowerCase().includes('analysis');

        if (
            queryNeedsData &&
            (healthDataQuality.completeness < 0.3 ||
                healthDataQuality.stability < 0.4)
        ) {
            await this.chatSessionModel.findOneAndUpdate(
                { sessionId },
                {
                    needsDoctorReview: true,
                    reviewReason: 'Insufficient health data for analysis',
                    healthDataQuality,
                    status: 'needs_review',
                },
            );

            return {
                text: generateHealthDataWarning(healthDataQuality),
                confidence: 0.4,
                metadata: { healthDataQuality, needsDoctorReview: true },
            };
        }

        // 4. Get conversation history
        const conversationHistory = await this.chatMessageModel
            .find({ sessionId })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();
        conversationHistory.reverse();

        // 5. Generate AI Response
        const aiOutput = await this.aiProviderService.generateMedicalResponse(
            message,
            userContext?.data,
            conversationHistory,
        );

        const needsDoctorReview =
            aiOutput.needsDoctorReview || aiOutput.confidence < 0.7;

        if (needsDoctorReview) {
            await this.chatSessionModel.findOneAndUpdate(
                { sessionId },
                {
                    needsDoctorReview: true,
                    reviewReason: 'Low AI confidence or safety flag',
                    aiConfidence: aiOutput.confidence,
                    healthDataQuality,
                    status: 'needs_review',
                },
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
            },
        };
    }

    // ─── Session & History Queries ──────────────────────────────────────────────

    async getSessionStatus(sessionId: string): Promise<any | null> {
        const session = await this.chatSessionModel
            .findOne({ sessionId })
            .select('sessionId status aiResponse aiMetadata completedAt')
            .lean();
        return session ?? null;
    }

    async getChatHistory(userId: string): Promise<any[]> {
        const messages = await this.chatMessageModel
            .find({ userId })
            .sort({ timestamp: 1 })
            .limit(50)
            .lean();

        return messages.map((m: any) => ({
            id: m._id,
            author: m.author === 'user' ? 'me' : 'other',
            text: m.text,
            timestamp: m.timestamp,
        }));
    }

    async getChatSessions(userId: string): Promise<any[]> {
        return this.chatSessionModel
            .find({ userId })
            .sort({ updatedAt: -1 })
            .limit(50)
            .lean();
    }

    async getSessionMessages(sessionId: string): Promise<any[]> {
        const messages = await this.chatMessageModel
            .find({ sessionId })
            .sort({ timestamp: 1 })
            .lean();

        return messages.map((m: any) => ({
            id: m._id,
            author:
                m.author === 'user' ? 'me' : m.author === 'doctor' ? 'doctor' : 'other',
            text: m.text,
            timestamp: m.timestamp,
            metadata: m.metadata,
        }));
    }

    // ─── Bookmarks ──────────────────────────────────────────────────────────────

    async toggleBookmark(
        sessionId: string,
        isBookmarked: boolean,
    ): Promise<any> {
        const session = await this.chatSessionModel.findOne({ sessionId });
        if (!session) return null;

        session.isBookmarked = isBookmarked;
        session.bookmarkedAt = isBookmarked ? new Date() : (null as any);
        await session.save();
        return session;
    }

    async getBookmarks(userId: string): Promise<any[]> {
        const bookmarkedSessions = await this.chatSessionModel
            .find({ userId, isBookmarked: true })
            .sort({ bookmarkedAt: -1 })
            .lean();

        const sessionsWithPreviews = await Promise.all(
            bookmarkedSessions.map(async (session: any) => {
                const firstMessage = await this.chatMessageModel
                    .findOne({ sessionId: session.sessionId, author: 'user' })
                    .sort({ timestamp: 1 })
                    .lean();

                return {
                    sessionId: session.sessionId,
                    userId: session.userId,
                    status: session.status,
                    isBookmarked: session.isBookmarked,
                    bookmarkedAt: session.bookmarkedAt,
                    createdAt: session.createdAt,
                    preview: firstMessage ? (firstMessage as any).text : 'No messages',
                };
            }),
        );

        return sessionsWithPreviews;
    }
}
