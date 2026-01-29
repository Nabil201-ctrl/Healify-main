import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { Expo } from 'expo-server-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key file
// You need to download this from Firebase Console -> Project Settings -> Service Accounts
const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

let firebaseInitialized = false;
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        firebaseInitialized = true;
        console.log("Firebase Admin SDK initialized successfully.");
    } else {
        console.warn("Warning: serviceAccountKey.json not found. Firebase notifications will be mocked.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

export const sendPushNotification = async (token, title, body, data = {}) => {
    if (Expo.isExpoPushToken(token)) {
        try {
            const receipt = await expo.sendPushNotificationsAsync([
                {
                    to: token,
                    sound: 'default',
                    title,
                    body,
                    data,
                }
            ]);
            console.log("Expo push response:", receipt);
            return receipt;
        } catch (err) {
            console.error("Expo push error:", err);
            throw err;
        }
    }

    if (!firebaseInitialized) {
        console.log(`[MOCK FCM] Sending to ${token}: ${title} - ${body}`, data);
        return;
    }

    const message = {
        notification: {
            title,
            body
        },
        data,
        token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};
