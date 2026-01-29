import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    author: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object } // For storing confidence, model version, etc.
});

export const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
