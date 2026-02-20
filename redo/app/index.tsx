/**
 * App entry point.
 * The AuthGate in _layout.tsx handles all auth-based redirects,
 * so this just redirects to (tabs) for initial navigation.
 * AuthGate will intercept and send to /(auth)/login if not authenticated.
 */
import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/(tabs)" />;
}
