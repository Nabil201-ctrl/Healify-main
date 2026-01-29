import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/DoctorAuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { View } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
    }),
});

const queryClient = new QueryClient();

function RootLayoutNav() {
    const { doctor, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!doctor && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/(auth)/login');
        } else if (doctor && inAuthGroup) {
            // Redirect to home if authenticated
            router.replace('/(tabs)/review-queue');
        }
    }, [doctor, segments, isLoading]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="session/[id]"
                options={{
                    headerShown: true,
                    title: 'Session Review',
                    headerBackTitle: 'Queue'
                }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <RootLayoutNav />
                    <StatusBar style="auto" />
                </AuthProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
