// app/_layout.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';


import { LoadingScreen } from '../components/LoadingScreen';
import tw from 'twrnc';

import { registerForPushNotificationsAsync, uploadPushToken } from '../services/NotificationService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// --- Main Navigation Logic ---
function RootLayoutNav() {
  const { isLoading: isAuthLoading, isSignedIn, user } = useAuthContext();


  const [loadingMessage, setLoadingMessage] = useState('Preparing your experience...');
  const [appIsReady, setAppIsReady] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasUploadedPush, setHasUploadedPush] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {



        // Register for Push Notifications early
        registerForPushNotificationsAsync().then(token => {
          if (token) {
            console.log("Push Token retrieved:", token);
            setPushToken(token);
          }
        });
      } catch (e) {
        console.warn('[RootLayout] Error during preparation:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    const uploadToken = async () => {
      if (!isSignedIn || !pushToken || hasUploadedPush) return;
      try {
        await uploadPushToken(pushToken);
        setHasUploadedPush(true);
      } catch (err) {
        console.warn('[RootLayout] Failed to upload push token:', err);
      }
    };

    uploadToken();
  }, [isSignedIn, pushToken, hasUploadedPush]);

  // Hide the native splash screen once our custom splash is showing
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells expo-splash-screen to hide the native splash
      // Our custom LoadingScreen with LifeLine is now visible
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    const isLoading = isAuthLoading;
    console.log('[RootLayout] Navigation effect triggered:', {
      isAuthLoading,
      isSignedIn,
      segments: segments.join('/'),
    });

    if (isAuthLoading) {
      console.log('[RootLayout] Still loading, waiting...');
      if (isAuthLoading) {
        setLoadingMessage('Verifying your session...');
      }
      return; // Wait until both auth and onboarding status are loaded
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAllowedStandalonePage = segments[0] === 'profile' || segments[0] === 'stats';

    // --- New Flow: Auth -> Onboarding Status Check ---

    // 1. Check if user is signed in
    if (!isSignedIn) {
      if (!inAuthGroup) {
        console.log('[RootLayout] User not signed in, redirecting to sign-in');
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    // 2. User is signed in, check onboarding status
    const onboardingStatus = user?.onboardingStatus || 'PENDING';

    console.log('[RootLayout] User signed in, checking status:', onboardingStatus);

    if (onboardingStatus === 'PENDING') {
      if (!inOnboardingGroup || segments[1] !== 'onboarding') {
        console.log('[RootLayout] Status PENDING, redirecting to onboarding slides');
        router.replace('/(onboarding)/onboarding');
      }
    } else if (onboardingStatus === 'PROFILE_SETUP') {
      if (!inOnboardingGroup || segments[1] !== 'profile-setup') {
        console.log('[RootLayout] Status PROFILE_SETUP, redirecting to profile-setup');
        router.replace('/(onboarding)/profile-setup');
      }
    } else {
      // Status is COMPLETED (or unknown/other, treat as completed)
      if (!inTabsGroup && !inAllowedStandalonePage) {
        console.log('[RootLayout] Status COMPLETED, redirecting to tabs/home');
        setLoadingMessage('Loading your dashboard...');
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 100);
      }
    }
  }, [isAuthLoading, isSignedIn, segments, router, user]);

  // Show premium loading screen (with LifeLine) as splash and loading screen
  if (!appIsReady || isAuthLoading) {
    return (
      <View style={tw`flex-1`} onLayout={onLayoutRootView}>
        <LoadingScreen message={loadingMessage} />
      </View>
    );
  }

  // Once loaded, render the navigation stack
  return (
    <View style={tw`flex-1`} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(chat)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

// --- Root Component with Providers ---
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}