import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/DoctorAuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Constants from 'expo-constants';

// ─── Notification handler (dev build only, skip in Expo Go) ───────────────────

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
    // Dynamically set up the notification handler only when not in Expo Go
    import('expo-notifications').then((Notifications) => {
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
    }).catch(() => {
        // Non-fatal — push notifications just won't show foreground alerts
    });
}

const queryClient = new QueryClient();

// ─── Root Nav ─────────────────────────────────────────────────────────────────

function RootLayoutNav() {
    const { doctor, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!doctor && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (doctor && inAuthGroup) {
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
                    headerBackTitle: 'Queue',
                }}
            />
        </Stack>
    );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

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
