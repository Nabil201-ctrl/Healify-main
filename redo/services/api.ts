import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { authEvents } from './authEvents';

// Use localhost for web/iOS and 10.0.2.2 for Android emulator
const DEV_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor — handle token expiry ────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    // Successful response — pass through unchanged
    (response) => response,

    // Error response
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Attempt token refresh
                const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const newAccessToken: string = data.accessToken;

                // Store the new token
                await AsyncStorage.setItem('accessToken', newAccessToken);
                if (data.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', data.refreshToken);
                }

                // Replay the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — clear tokens and signal unauthenticated
                processQueue(refreshError, null);
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);

                // Notify the AuthProvider to redirect to login
                authEvents.emit('unauthorized');

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // For non-401 errors or already-retried requests, just reject
        return Promise.reject(error);
    }
);

export default api;
