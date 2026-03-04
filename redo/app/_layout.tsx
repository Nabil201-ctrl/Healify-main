import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// ─── Auth Gate ────────────────────────────────────────────────────────────────
//
// This component lives *inside* the AuthProvider and uses the auth state to
// redirect the user to the right place. It runs on every navigation segment
// change and whenever authState changes.
//
function AuthGate({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authState === 'loading') return; // Wait until we know

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inProtected = !inAuthGroup && !inOnboarding;

    if (authState === 'unauthenticated' && inProtected) {
      // User is not signed in but trying to access a protected route
      console.log('[AuthGate] Not authenticated — redirecting to login');
      router.replace('/(auth)/login');
    }

    if (authState === 'authenticated' && inAuthGroup) {
      // User is signed in but landed on a login/register screen
      // Try to determine where they should go based on their profile completion
      import('@/services/UserService').then(({ UserService }) => {
        UserService.getProfile().then(profile => {
          if (!profile.isProfileComplete) {
            router.replace('/(onboarding)/onboarding');
          } else {
            router.replace('/(onboarding)/data-policy');
          }
        }).catch(() => router.replace('/(onboarding)/data-policy')); // Fallback
      });
    }
  }, [authState, segments]);

  if (authState === 'loading') {
    // Show a blank splash while we check the stored token
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'BricolageGrotesque': require('@expo-google-fonts/bricolage-grotesque/400Regular/BricolageGrotesque_400Regular.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="metrics/[type]" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}
