import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    type: string; // HIGH_HEART_RATE | ACTIVITY_DROP | GOAL_REACHED | SLEEP_REPORT | HEALTH_UPDATE | etc.

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    read: boolean;

    @Prop()
    timestamp: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
