import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
    doctorId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed with bcrypt
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialization: { type: String },
    licenseNumber: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    refreshToken: { type: String },
    pushTokens: [{ type: String }] // Store multiple tokens for multiple devices
});

export const Doctor = mongoose.model('Doctor', DoctorSchema);
