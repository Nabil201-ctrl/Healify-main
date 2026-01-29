import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived', 'needs_review', 'under_review', 'reviewed'],
        default: 'active'
    },
    isBookmarked: { type: Boolean, default: false, index: true },
    bookmarkedAt: { type: Date },

    // AI Safety Fields
    needsDoctorReview: { type: Boolean, default: false, index: true },
    reviewReason: { type: String },
    aiConfidence: { type: Number, min: 0, max: 1 },
    healthDataQuality: {
        completeness: { type: Number },
        stability: { type: Number },
        dataPoints: { type: Number }
    },

    // Doctor Review Fields
    assignedDoctorId: { type: String, index: true },
    reviewedAt: { type: Date },
    doctorNotes: { type: String }
});

export const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
