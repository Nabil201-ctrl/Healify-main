import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { doctorLogin, doctorLogout, getDoctorInfo, registerPushToken } from '../services/DoctorAuthService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    doctor: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
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
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token that uniquely identifies this device
        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log("Push Token:", token);
        } catch (e) {
            console.error("Error getting push token:", e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const info = await getDoctorInfo();
                if (info) {
                    setDoctor(info);
                    // Register for push notifications if logged in
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                        await registerPushToken(token);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        const doctorInfo = await doctorLogin(email, pass);
        setDoctor(doctorInfo);

        // Register for push notifications on login
        const token = await registerForPushNotificationsAsync();
        if (token) {
            await registerPushToken(token);
        }
    };

    const logout = async () => {
        await doctorLogout();
        setDoctor(null);
    };

    return (
        <AuthContext.Provider value={{ doctor, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
