import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import { AuthService } from "../services/AuthService";

export const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

// ✅ Create Axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // Increased timeout to 15 seconds
    headers: {
        "Content-Type": "application/json",
    },
});

// Queue for offline requests
let offlineQueue: Array<{
    config: any;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}> = [];

// Check if device is online
async function isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true && netInfo.isInternetReachable !== false;
}

// Process queued requests when back online
async function processOfflineQueue() {
    if (offlineQueue.length === 0) return;

    console.log(`[API] Processing ${offlineQueue.length} queued requests`);
    const queue = [...offlineQueue];
    offlineQueue = [];

    for (const item of queue) {
        try {
            const response = await api.request(item.config);
            item.resolve(response);
        } catch (error) {
            item.reject(error);
        }
    }
}

// Listen for network changes
NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) {
        processOfflineQueue();
    }
});

// ✅ Automatically attach token before every request
api.interceptors.request.use(
    async (config) => {
        // Check if online for non-critical requests
        const online = await isOnline();
        if (!online && config.method?.toLowerCase() !== 'get') {
            console.warn('[API] Device is offline, request may fail');
        }

        // Don't add access token to refresh endpoint (it uses refresh token instead)
        if (config.url !== '/auth/refresh') {
            const token = await AsyncStorage.getItem("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Handle errors globally with retry logic

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
            const online = await isOnline();

            if (!online) {
                // Device is offline - queue the request if it's not a GET
                if (originalRequest.method?.toLowerCase() !== 'get') {
                    console.log('[API] Queueing request for when online');
                    return new Promise((resolve, reject) => {
                        offlineQueue.push({
                            config: originalRequest,
                            resolve,
                            reject,
                        });
                    });
                }

                return Promise.reject({
                    message: 'No internet connection. Please check your network and try again.',
                    isNetworkError: true,
                    originalError: error,
                });
            }

            // Network error but device claims to be online
            return Promise.reject({
                message: 'Unable to connect to the server. Please try again later.',
                isNetworkError: true,
                originalError: error,
            });
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            return Promise.reject({
                message: 'Request timed out. Please try again.',
                isTimeout: true,
                originalError: error,
            });
        }

        // Don't retry refresh endpoint itself
        if (originalRequest.url === '/auth/refresh' || !error.response) {
            return Promise.reject(error);
        }

        // Handle 401 errors with token refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const { accessToken } = await AuthService.refreshToken();
                processQueue(null, accessToken);
                originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
                // Optionally, trigger a logout or redirect to login
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle other HTTP errors with user-friendly messages
        if (error.response) {
            const status = error.response.status;
            let message = error.response.data?.message || 'An error occurred';

            switch (status) {
                case 400:
                    message = error.response.data?.message || 'Invalid request. Please check your input.';
                    break;
                case 403:
                    message = 'You do not have permission to perform this action.';
                    break;
                case 404:
                    message = 'The requested resource was not found.';
                    break;
                case 500:
                    message = 'Server error. Please try again later.';
                    break;
                case 503:
                    message = 'Service temporarily unavailable. Please try again later.';
                    break;
            }

            return Promise.reject({
                message,
                status,
                data: error.response.data,
                originalError: error,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
