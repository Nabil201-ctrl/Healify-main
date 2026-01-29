import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

/**
 * Send push notifications to multiple tokens
 * @param {string[]} pushTokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export async function sendPushNotification(pushTokens, title, body, data = {}) {
    const messages = [];

    for (let pushToken of pushTokens) {
        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        });
    }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications.
    // We recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Notification tickets:', ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error('Error sending notification chunk:', error);
        }
    }

    return tickets;
}

/**
 * Send notification to a specific doctor
 * @param {object} doctor - Doctor document
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 */
export async function notifyDoctor(doctor, title, body, data = {}) {
    if (!doctor || !doctor.pushTokens || doctor.pushTokens.length === 0) {
        console.log(`No push tokens found for doctor ${doctor?.email}`);
        return;
    }

    console.log(`Sending notification to doctor ${doctor.email}: ${title}`);
    return await sendPushNotification(doctor.pushTokens, title, body, data);
}
