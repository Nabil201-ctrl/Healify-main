import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({ timestamps: true })
export class Doctor {
    @Prop({ required: true, unique: true, index: true })
    doctorId: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    specialization: string;

    @Prop({ required: true })
    licenseNumber: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    refreshToken: string;

    @Prop({ type: [String], default: [] })
    pushTokens: string[];
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
