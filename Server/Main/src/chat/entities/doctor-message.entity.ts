import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DoctorMessageDocument = HydratedDocument<DoctorMessage>;

@Schema({ timestamps: true })
export class DoctorMessage {
    @Prop({ required: true, index: true })
    sessionId: string;

    @Prop({ required: true })
    doctorId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    text: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;

    @Prop({ default: false })
    isRead: boolean;
}

export const DoctorMessageSchema = SchemaFactory.createForClass(DoctorMessage);
