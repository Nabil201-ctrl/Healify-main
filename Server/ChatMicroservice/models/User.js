import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    // Profile Fields
    age: Number,
    height: Number,
    weight: Number,
    bodyType: String,
    healthIssues: [String],
    allergies: [String],
    medications: [String],
    averageSteps: Number,
    activityLevel: String,
    jobType: String,
    daysLessActive: [String],
    isProfileComplete: Boolean,
    onboardingStatus: {
        type: String,
        enum: ['PENDING', 'PROFILE_SETUP', 'COMPLETED'],
        default: 'PENDING'
    }
}, {
    timestamps: true,
    collection: 'users' // Explicitly map to 'users' collection
});

export const User = mongoose.model('User', userSchema);
