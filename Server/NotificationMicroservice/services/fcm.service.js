import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Requires GOOGLE_APPLICATION_CREDENTIALS environment variable or service account key file
 */
export function initializeFirebase() {
    if (firebaseApp) {
        console.log('[FCM] Firebase already initialized');
        return firebaseApp;
    }

    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            path.join(__dirname, '../../serviceAccountKey.json');

        // Check if running in production with environment variables
        if (process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY) {

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });

            console.log('[FCM] Firebase initialized with environment variables');
        } else {
            // Use service account file
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath),
            });

            console.log('[FCM] Firebase initialized with service account file');
        }

        return firebaseApp;
    } catch (error) {
        console.error('[FCM] Failed to initialize Firebase:', error);
        throw error;
    }
}

/**
 * Send a push notification to a single device
 * @param {string} token - FCM device token or Expo push token
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {Promise<string>} Message ID if successful
 */
export async function sendNotification(token, notification, data = {}) {
    try {
        if (!firebaseApp) {
            initializeFirebase();
        }

        const message = {
            token,
            notification: {
                title: notification.title,
                body: notification.body,
                imageUrl: notification.imageUrl,
            },
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'healify-notifications',
                    sound: 'default',
                    color: '#10B981',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('[FCM] Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('[FCM] Error sending notification:', error);

        // Handle invalid token errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.log('[FCM] Invalid token, should be removed from database:', token);
            throw { code: 'INVALID_TOKEN', token, originalError: error };
        }

        throw error;
    }
}

/**
 * Send notifications to multiple devices
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} Batch response with success and failure counts
 */
export async function sendBatchNotifications(tokens, notification, data = {}) {
    try {
        if (!firebaseApp) {
            initializeFirebase();
        }

        if (!tokens || tokens.length === 0) {
            console.warn('[FCM] No tokens provided for batch notification');
            return { successCount: 0, failureCount: 0 };
        }

        const message = {
            notification: {
                title: notification.title,
                body: notification.body,
                imageUrl: notification.imageUrl,
            },
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'healify-notifications',
                    sound: 'default',
                    color: '#10B981',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            ...message,
        });

        console.log(`[FCM] Batch send: ${response.successCount} successful, ${response.failureCount} failed`);

        // Log failed tokens
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`[FCM] Failed to send to token ${tokens[idx]}:`, resp.error);
                }
            });
        }

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            invalidTokens: response.responses
                .map((resp, idx) => resp.success ? null : tokens[idx])
                .filter(Boolean),
        };
    } catch (error) {
        console.error('[FCM] Error sending batch notifications:', error);
        throw error;
    }
}

/**
 * Verify a token is valid
 * @param {string} token - FCM device token
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyToken(token) {
    try {
        if (!firebaseApp) {
            initializeFirebase();
        }

        // Try to send a dry-run message
        await admin.messaging().send({
            token,
            notification: {
                title: 'Test',
                body: 'Test',
            },
        }, true); // dry run

        return true;
    } catch (error) {
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return false;
        }
        throw error;
    }
}
