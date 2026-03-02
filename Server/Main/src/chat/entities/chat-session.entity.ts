import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@Schema({ timestamps: true })
export class ChatSession {
    @Prop({ required: true, unique: true, index: true })
    sessionId: string;

    @Prop({ required: true, index: true })
    userId: string;

    @Prop({
        type: String,
        enum: [
            'active',
            'completed',
            'archived',
            'needs_review',
            'under_review',
            'reviewed',
        ],
        default: 'active',
    })
    status: string;

    @Prop({ type: Boolean, default: false, index: true })
    isBookmarked: boolean;

    @Prop()
    bookmarkedAt: Date;

    @Prop({ default: 'New Chat' })
    title: string;

    // AI Safety Fields
    @Prop({ type: Boolean, default: false, index: true })
    needsDoctorReview: boolean;

    @Prop()
    reviewReason: string;

    @Prop({ type: Number, min: 0, max: 1 })
    aiConfidence: number;

    @Prop({
        type: {
            completeness: { type: Number },
            stability: { type: Number },
            dataPoints: { type: Number },
        },
    })
    healthDataQuality: {
        completeness: number;
        stability: number;
        dataPoints: number;
    };

    // AI Response (stored here for polling)
    @Prop()
    aiResponse: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    aiMetadata: any;

    @Prop()
    completedAt: Date;

    // Doctor Review Fields
    @Prop({ index: true })
    assignedDoctorId: string;

    @Prop()
    reviewedAt: Date;

    @Prop()
    doctorNotes: string;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
