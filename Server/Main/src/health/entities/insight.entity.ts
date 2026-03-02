import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InsightDocument = HydratedDocument<Insight>;

@Schema({ timestamps: true })
export class Insight {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    date: string;

    @Prop({ required: true })
    type: string; // HEART_RATE_TREND, ACTIVITY_DROP, etc.

    @Prop({ required: true })
    message: string;

    @Prop({ type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' })
    severity: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;
}

export const InsightSchema = SchemaFactory.createForClass(Insight);
