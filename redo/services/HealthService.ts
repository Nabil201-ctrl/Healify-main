import api from './api';

export interface ActivityData {
    labels: string[];
    datasets: { data: number[] }[];
    summary: {
        dailyAvg: number;
        weeklyTotal: number;
        goal: number;
    };
}

export interface HeartRateData {
    labels: string[];
    datasets: { data: number[] }[];
    stats: {
        min: number;
        avg: number;
        max: number;
        resting: number;
    };
}

export interface SleepData {
    labels: string[];
    data: number[][]; // [Deep, Light, REM]
    lastNight: {
        duration: string;
        quality: string;
        bedtime: string;
    };
}

export interface QuickStatsData {
    distance: string;
    activeTime: string;
    floors: string;
    stress: string;
    recovery: string;
}

export interface InsightData {
    label: string;
    text: string;
    type: 'positive' | 'warning' | 'info';
}

export const HealthService = {
    /**
     * Fetch user activity data (steps, etc.)
     */
    getActivity: async (): Promise<ActivityData> => {
        try {
            const response = await api.get('/health/activity');
            return response.data;
        } catch (error) {
            console.warn('Error fetching activity data:', error);
            throw error;
        }
    },

    /**
     * Fetch user heart rate data
     */
    getHeartRate: async (): Promise<HeartRateData> => {
        try {
            const response = await api.get('/health/heart-rate');
            return response.data;
        } catch (error) {
            console.warn('Error fetching heart rate data:', error);
            throw error;
        }
    },

    /**
     * Fetch user sleep data
     */
    getSleep: async (): Promise<SleepData> => {
        try {
            const response = await api.get('/health/sleep');
            return response.data;
        } catch (error) {
            console.warn('Error fetching sleep data:', error);
            throw error;
        }
    },

    /**
     * Fetch quick stats (distance, floors, etc.)
     */
    getQuickStats: async (): Promise<QuickStatsData> => {
        try {
            const response = await api.get('/health/quick-stats');
            return response.data;
        } catch (error) {
            console.warn('Error fetching quick stats:', error);
            throw error;
        }
    },

    /**
     * Fetch health insights
     */
    getInsights: async (): Promise<InsightData[]> => {
        try {
            const response = await api.get('/health/insights');
            return response.data.insights || [];
        } catch (error) {
            console.warn('Error fetching insights:', error);
            throw error;
        }
    },

    /**
     * Sync health data from mobile device
     */
    syncHealthData: async (data: any) => {
        try {
            const response = await api.post('/health/sync', data);
            return response.data;
        } catch (error) {
            console.warn('Error syncing health data:', error);
            throw error;
        }
    },

    /**
     * Force sync Google Fit data directly on the backend via OAuth access token
     */
    syncGoogleFit: async (accessToken: string) => {
        try {
            const response = await api.post('/health/google-fit/sync', { accessToken });
            return response.data;
        } catch (error) {
            console.warn('Error syncing Google Fit data:', error);
            throw error;
        }
    }
};
