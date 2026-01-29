import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Doctor } from '../models/Doctor.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healify_chat";

async function createTestDoctor() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const email = "doctor@healify.com";
        const password = "password123";

        // Check if exists
        const existing = await Doctor.findOne({ email });
        if (existing) {
            console.log("Test doctor already exists:");
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const doctorId = `DOC_TEST_${Date.now()}`;

        const doctor = await Doctor.create({
            doctorId,
            email,
            password: hashedPassword,
            firstName: "Gregory",
            lastName: "House",
            specialization: "Diagnostician",
            licenseNumber: "MD-12345-TEST"
        });

        console.log("✅ Test Doctor Created Successfully!");
        console.log("-----------------------------------");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Doctor ID: ${doctorId}`);
        console.log("-----------------------------------");
        console.log("You can now login with these credentials in the Doctor App.");

    } catch (error) {
        console.error("Error creating test doctor:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createTestDoctor();
