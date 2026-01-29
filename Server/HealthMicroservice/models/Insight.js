import mongoose from 'mongoose';

const InsightSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'HEART_RATE_TREND', 'ACTIVITY_DROP'
    message: { type: String, required: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
    timestamp: { type: Date, default: Date.now }
});

export const Insight = mongoose.model('Insight', InsightSchema);
