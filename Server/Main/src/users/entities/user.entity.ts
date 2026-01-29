import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
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

  // Health Profile Fields
  @Prop()
  age?: number;

  @Prop()
  height?: number; // cm

  @Prop()
  weight?: number; // kg

  @Prop({ type: String, enum: ['Slim', 'Lean', 'Fat', 'Average'] })
  bodyType?: string;

  @Prop({ type: [String], default: [] })
  healthIssues?: string[];

  @Prop({ type: [String], default: [] })
  allergies?: string[];

  @Prop({ type: [String], default: [] })
  medications?: string[];

  @Prop()
  averageSteps?: number;

  @Prop({ type: String, enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] })
  activityLevel?: string;

  @Prop({ type: String, enum: ['Active', 'Office', 'Mixed'] })
  jobType?: string;

  @Prop({ type: [String], default: [] })
  daysLessActive?: string[];

  @Prop({ default: false })
  isProfileComplete: boolean;

  @Prop({
    type: String,
    enum: ['PENDING', 'PROFILE_SETUP', 'COMPLETED'],
    default: 'PENDING'
  })
  onboardingStatus: string;

  @Prop({ type: [String], default: [] })
  pushTokens?: string[];

  @Prop()
  location?: string; // User's location (city, state, country)
}

export const UserSchema = SchemaFactory.createForClass(User);
