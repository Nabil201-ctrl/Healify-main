import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HealthLogDocument = HydratedDocument<HealthLog>;

@Schema({ timestamps: true })
export class HealthLog {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, index: true })
    date: string; // YYYY-MM-DD

    @Prop()
    heartRate: number;

    @Prop()
    steps: number;

    @Prop()
    sleep: number; // hours

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;
}

export const HealthLogSchema = SchemaFactory.createForClass(HealthLog);
