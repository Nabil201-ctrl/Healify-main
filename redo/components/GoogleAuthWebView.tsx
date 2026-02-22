import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useColorScheme } from './useColorScheme';

interface GoogleAuthWebViewProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (userInfo: any) => void;
    onError: (error: string) => void;
}

export function GoogleAuthWebView({ visible, onClose, onSuccess, onError }: GoogleAuthWebViewProps) {
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [authUrl, setAuthUrl] = useState<string | null>(null);

    React.useEffect(() => {
        if (visible) {
            // Fetch the URL from the backend so the frontend does not need Google credentials
            // Make sure the backend provides this endpoint
            fetch('https://healify-main.vercel.app/auth/google/url')
                .then(res => res.json())
                .then(data => {
                    setAuthUrl(data.url);
                })
                .catch(err => {
                    console.warn('Failed to get auth URL:', err);
                    onError('Failed to initiate Google Login. Is backend running?');
                });
        } else {
            setAuthUrl(null);
            setLoading(true);
        }
    }, [visible, onError]);

    const handleNavigationStateChange = async (navState: WebViewNavigation) => {
        const url = navState.url;

        // Check for access token in the URL fragment or query
        if (url.includes('access_token=')) {
            const matches = url.match(/access_token=([^&]*)/);
            if (matches && matches[1]) {
                const accessToken = matches[1];
                // Pass the token to onSuccess which sends it to backend
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
                    <View style={{ width: 50 }} />
                </View>
                {authUrl ? (
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
                ) : (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                )}
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
