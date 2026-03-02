import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true })
export class ChatMessage {
    @Prop({ required: true, index: true })
    sessionId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, enum: ['user', 'ai', 'doctor'] })
    author: string;

    @Prop({ required: true })
    text: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata: any;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
