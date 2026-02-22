import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface GoogleAuthWebViewProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (userInfo: any) => void;
    onError: (error: string) => void;
}

// Ensure you replace this with your real Google Client ID in the Google Cloud Console
// NOTE: Make sure the Redirect URI matches where the app expects to be redirected
const GOOGLE_CLIENT_ID = '374585175818-4r773ah94ebtskltec8k61s2c8okc3iv.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:4000/google/callback';

export function GoogleAuthWebView({ visible, onClose, onSuccess, onError }: GoogleAuthWebViewProps) {
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=email%20profile`;

    const handleNavigationStateChange = async (navState: WebViewNavigation) => {
        const url = navState.url;

        // Check for access token in the URL fragment or query
        if (url.includes('access_token=')) {
            const matches = url.match(/access_token=([^&]*)/);
            if (matches && matches[1]) {
                const accessToken = matches[1];
                // Instead of fetching here, we pass the token to onSuccess
                // The backend will perform the 'communicating with google' step
                onSuccess({ token: accessToken });
                onClose();
            } else {
                onError('Access token missing in URL.');
                onClose();
            }
        } else if (url.includes('error=')) {
            onError('Google Login failed or was cancelled.');
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
                <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Google Sign In</Text>
                    <View style={{ width: 50 }} /> {/* Spacer */}
                </View>
                <WebView
                    source={{ uri: authUrl }}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadEnd={() => setLoading(false)}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color="#4f46e5" />
                        </View>
                    )}
                    incognito={true}
                    userAgent="Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36" // Bypass Google block on embedded webviews
                />
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        paddingTop: 50, // basic safe area allowance
    },
    closeButton: {
    },
    closeText: {
        color: '#4f46e5',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    }
});
