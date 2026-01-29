import GoogleFit, { Scopes } from 'react-native-google-fit';
import { PermissionsAndroid, Platform } from 'react-native';
import api from '../api/api';

const GOOGLE_FIT_OPTIONS = {
    scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_ACTIVITY_WRITE,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_BODY_WRITE,
        Scopes.FITNESS_LOCATION_READ,
    ],
};

export const HealthService = {
    async authorize() {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
                );

                // You might also need ACCESS_FINE_LOCATION for some Fit data
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    const res = await GoogleFit.authorize(GOOGLE_FIT_OPTIONS);
                    if (res.success) {
                        console.log('[HealthService] ✅ Google Fit Authorized Successfully');

                        // Notify backend of successful connection
                        await this.notifyBackendConnection('connected');

                        return true;
                    } else {
                        console.log('[HealthService] ❌ Google Fit Authorization Failed', res.message);
                        await this.notifyBackendConnection('failed');
                        return false;
                    }
                } else {
                    console.log('[HealthService] ❌ Android permission denied');
                    await this.notifyBackendConnection('permission_denied');
                    return false;
                }
            } catch (err) {
                console.warn('[HealthService] Authorization error:', err);
                await this.notifyBackendConnection('error');
                return false;
            }
        }
        console.log('[HealthService] ⚠️ Google Fit is only available on Android');
        return false;
    },

    async notifyBackendConnection(status: string) {
        try {
            await api.post('/health/google-fit/connect', {
                platform: Platform.OS,
                status: status,
                timestamp: new Date().toISOString()
            });
            console.log(`[HealthService] Backend notified of Google Fit status: ${status}`);
        } catch (e: any) {
            console.log('[HealthService] Failed to notify backend (non-critical):', e.message);
        }
    },

    async getDailyStats() {
        // Check if authorized
        if (!GoogleFit.isAuthorized) {
            console.warn('[HealthService] Google Fit not authorized, stats will be empty.');
            return { steps: 0, distance: 0, calories: 0 };
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = today.toISOString();

        const options = {
            startDate: startOfDay,
            endDate: endOfDay,
            bucketUnit: 'DAY', // optional - default "DAY". Options: "NANOSECOND", "MICROSECOND", "MILLISECOND", "SECOND", "MINUTE", "HOUR", "DAY"
            bucketInterval: 1, // optional - default 1. 
        };

        try {
            const stepRes = await GoogleFit.getDailyStepCountSamples(options);
            const distanceRes = await GoogleFit.getDailyDistanceSamples(options);
            const calorieRes = await GoogleFit.getDailyCalorieSamples(options);

            // Process Steps (Google Fit returns array of sources, ensuring we sum or take the merge)
            // Usually 'com.google.android.gms' is the merged source.
            const stepSamples = stepRes.find(r => r.source === 'com.google.android.gms')?.steps || [];
            const totalSteps = stepSamples.length > 0 ? stepSamples[0].value : 0;

            // Process Distance
            const totalDistance = distanceRes.reduce((acc, curr) => acc + curr.distance, 0);

            // Process Calories
            // Calorie samples might be granular, need to sum
            const totalCalories = calorieRes.reduce((acc, curr) => acc + curr.calorie, 0);

            return {
                steps: totalSteps,
                distance: totalDistance,
                calories: totalCalories
            };

        } catch (err) {
            console.error('[HealthService] Error fetching stats:', err);
            return { steps: 0, distance: 0, calories: 0 };
        }
    },

    async logData() {
        const stats = await this.getDailyStats();
        console.log('[HealthService] --- LOGGING TO BACKEND ---');
        console.log('[HealthService] Steps:', stats.steps);
        console.log('[HealthService] Distance:', stats.distance);
        console.log('[HealthService] Calories:', stats.calories);

        // Send to backend via /health/sync endpoint
        try {
            await api.post('/health/sync', {
                date: new Date().toISOString(),
                metrics: stats
            });
            console.log('[HealthService] ✅ Successfully synced to /health/sync');
        } catch (e: any) {
            console.log('[HealthService] ⚠️ Failed to sync to backend:', e.message);
        }

        return stats;
    }
};
