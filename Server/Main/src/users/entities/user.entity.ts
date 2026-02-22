import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// Nested medication schema
const MedicationSchema = {
  name: { type: String, required: true },
  reason: { type: String },
  dosage: { type: String },
  endDate: { type: String },
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop()
  refreshToken?: string;

  // ── Physical ──────────────────────────────────────────────────────────────
  @Prop()
  age?: number;

  @Prop()
  height?: number; // cm

  @Prop()
  weight?: number; // kg

  @Prop()
  sleepHours?: number; // avg hrs/night

  @Prop({
    type: String,
    enum: ['Slim', 'Lean', 'Average', 'Athletic', 'Overweight'],
  })
  bodyType?: string;

  @Prop({
    type: String,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  })
  gender?: string;

  @Prop({
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
  })
  bloodType?: string;

  // ── Lifestyle ─────────────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
  })
  activityLevel?: string;

  @Prop({ type: String, enum: ['Active', 'Office', 'Mixed'] })
  jobType?: string;

  @Prop()
  averageSteps?: number;

  @Prop({ type: [String], default: [] })
  daysLessActive?: string[];

  @Prop({ type: String, enum: ['Never', 'Former', 'Current'] })
  smokingStatus?: string;

  @Prop({ type: String, enum: ['None', 'Occasional', 'Moderate', 'Heavy'] })
  alcoholUse?: string;

  // ── Personal ──────────────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'],
  })
  maritalStatus?: string;

  @Prop()
  hasChildren?: boolean;

  @Prop()
  numberOfChildren?: number;

  @Prop()
  emergencyContactName?: string;

  @Prop()
  emergencyContactPhone?: string;

  @Prop()
  location?: string;

  // ── Medical ───────────────────────────────────────────────────────────────
  @Prop({ type: [String], default: [] })
  healthIssues?: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions?: string[];

  @Prop({ type: [String], default: [] })
  allergies?: string[];

  @Prop({ type: [MedicationSchema], default: [] })
  medications?: {
    name: string;
    reason?: string;
    dosage?: string;
    endDate?: string;
  }[];

  // ── Meta ──────────────────────────────────────────────────────────────────
  @Prop({ default: false })
  isProfileComplete: boolean;

  @Prop({
    type: String,
    enum: ['PENDING', 'PROFILE_SETUP', 'COMPLETED'],
    default: 'PENDING',
  })
  onboardingStatus: string;

  @Prop({ type: [String], default: [] })
  pushTokens?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
