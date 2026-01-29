import mongoose from 'mongoose';

const DoctorMessageSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

export const DoctorMessage = mongoose.model('DoctorMessage', DoctorMessageSchema);
