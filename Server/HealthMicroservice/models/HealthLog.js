import mongoose from 'mongoose';

const HealthLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    heartRate: { type: Number },
    steps: { type: Number },
    sleep: { type: Number }, // hours
    timestamp: { type: Date, default: Date.now }
});

export const HealthLog = mongoose.model('HealthLog', HealthLogSchema);
