import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GoogleAuthWebView } from '@/components/GoogleAuthWebView';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showGoogleAuth, setShowGoogleAuth] = useState(false);

    const router = useRouter();
    const { onAuthSuccess } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.login(email, password);
            onAuthSuccess(); // triggers AuthGate to redirect to /(tabs)
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (userInfo: any) => {
        try {
            setIsLoading(true);
            await AuthService.googleLogin(userInfo.email, userInfo.given_name || 'Google', userInfo.family_name || 'User', userInfo.picture);
            onAuthSuccess();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Google Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>Sign in to continue</Text>

                <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <Input
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Button title="Sign In" onPress={handleLogin} isLoading={isLoading} />

                <View style={styles.divider}>
                    <View style={[styles.line, { backgroundColor: colors.tabIconDefault }]} />
                    <Text style={[styles.orText, { color: colors.tabIconDefault }]}>OR</Text>
                    <View style={[styles.line, { backgroundColor: colors.tabIconDefault }]} />
                </View>

                <Button
                    title="Sign in with Google"
                    onPress={() => setShowGoogleAuth(true)}
                    isLoading={isLoading}
                    style={{ backgroundColor: '#DB4437' }}
                />

                <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkContainer}>
                    <Text style={[styles.linkText, { color: colors.tint }]}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>

                <GoogleAuthWebView
                    visible={showGoogleAuth}
                    onClose={() => setShowGoogleAuth(false)}
                    onSuccess={handleGoogleSuccess}
                    onError={(err) => Alert.alert('Google Sign In Error', err)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 30,
    },
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
    },
    orText: {
        width: 50,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
});
