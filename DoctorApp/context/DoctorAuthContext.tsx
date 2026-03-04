import React, { createContext, useState, useContext, useEffect } from 'react';
import { doctorLogin, doctorLogout, doctorRegister, getDoctorInfo, registerPushToken } from '../services/DoctorAuthService';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type Doctor = {
    doctorId: string;
    email: string;
    firstName: string;
    lastName: string;
    specialization: string;
};

type AuthContextType = {
    doctor: Doctor | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        specialization?: string;
        licenseNumber: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
    doctor: null,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// ─── Push notification helper (Expo Go safe) ──────────────────────────────────
// expo-notifications remote push was removed from Expo Go in SDK 53.
// We gracefully skip registration when running in Expo Go.

async function tryRegisterForPushNotifications(): Promise<string | undefined> {
    // Skip entirely in Expo Go — only works in a dev build or production
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
        console.log('[PushNotif] Skipping — not available in Expo Go. Use a dev build.');
        return undefined;
    }

    try {
        // Dynamically import so the module doesn't crash the bundle in Expo Go
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!Device.isDevice) {
            console.log('[PushNotif] Must use physical device for push notifications.');
            return undefined;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('[PushNotif] Permission not granted.');
            return undefined;
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            (Constants as any)?.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('[PushNotif] Token:', tokenData.data);
        return tokenData.data;
    } catch (e) {
        // Swallow — push notifications are non-critical
        console.warn('[PushNotif] Registration failed (non-fatal):', e);
        return undefined;
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check persisted session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const info = await getDoctorInfo();
                if (info) {
                    setDoctor(info);
                    // Best-effort push token registration
                    const token = await tryRegisterForPushNotifications();
                    if (token) await registerPushToken(token).catch(() => { });
                }
            } catch (e) {
                console.error('[AuthContext] Session check failed:', e);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    // ── Login ──────────────────────────────────────────────────────────────────

    const login = async (email: string, pass: string) => {
        const doctorInfo = await doctorLogin(email, pass);
        setDoctor(doctorInfo);

        const token = await tryRegisterForPushNotifications();
        if (token) await registerPushToken(token).catch(() => { });
    };

    // ── Register ───────────────────────────────────────────────────────────────

    const register = async (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        specialization?: string;
        licenseNumber: string;
    }) => {
        const doctorInfo = await doctorRegister(data);
        setDoctor(doctorInfo);

        const token = await tryRegisterForPushNotifications();
        if (token) await registerPushToken(token).catch(() => { });
    };

    // ── Logout ─────────────────────────────────────────────────────────────────

    const logout = async () => {
        await doctorLogout();
        setDoctor(null);
    };

    return (
        <AuthContext.Provider value={{ doctor, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
