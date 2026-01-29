import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/api';

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
}

/**
 * Register for push notifications and get token
 * Returns token if successful, undefined otherwise
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#10B981',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return undefined;
        }

        // Get the token that uniquely identifies this device
        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log("[Notifications] Expo Push Token:", token);
        } catch (e) {
            console.error("[Notifications] Error getting push token:", e);
            return undefined;
        }
    } else {
        console.log('[Notifications] Must use physical device for Push Notifications');
        return undefined;
    }

    return token;
}

/**
 * Upload push token to backend with retry logic
 */
export async function uploadPushToken(token: string, retries = 3): Promise<boolean> {
    if (!token) {
        console.warn('[Notifications] No token to upload');
        return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await api.post('/users/push-token', { token });
            console.log('[Notifications] Push token uploaded successfully');
            return true;
        } catch (error: any) {
            console.error(`[Notifications] Failed to upload push token (attempt ${attempt}/${retries})`,
                error?.response?.data || error?.message);

            if (attempt === retries) {
                console.error('[Notifications] All retry attempts failed');
                return false;
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }

    return false;
}

/**
 * Register for push notifications and upload token to backend
 * Call this after user logs in
 */
export async function registerAndUploadPushToken(): Promise<boolean> {
    try {
        const token = await registerForPushNotificationsAsync();

        if (!token) {
            console.log('[Notifications] No token obtained, skipping upload');
            return false;
        }

        const uploaded = await uploadPushToken(token);
        return uploaded;
    } catch (error) {
        console.error('[Notifications] Error in registerAndUploadPushToken:', error);
        return false;
    }
}

/**
 * Set up notification listeners
 * Call this in your root component
 */
export function setupNotificationListeners() {
    // Handle notification received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('[Notifications] Notification received:', notification);
    });

    // Handle notification tapped/clicked
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('[Notifications] Notification tapped:', response);
        // You can navigate to specific screens based on notification data
        const data = response.notification.request.content.data;
        // TODO: Add navigation logic based on notification type
    });

    return {
        receivedSubscription,
        responseSubscription,
    };
}
