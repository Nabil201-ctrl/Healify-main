import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, useColorScheme, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LifeLine } from 'react-loading-indicators';
import tw from 'twrnc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadingScreenProps {
    message?: string;
    showProgress?: boolean;
    progress?: number;
}

/**
 * Premium loading screen with LifeLine indicator animation.
 * Uses react-loading-indicators for the heartbeat-style loader.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...',
    showProgress = false,
    progress = 0,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        // Initial fade in and scale up
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const gradientColors: [string, string, string] = isDark
        ? ['#0f172a', '#1e293b', '#0f172a']
        : ['#f0fdf4', '#ecfdf5', '#dcfce7'];

    return (
        <LinearGradient
            colors={gradientColors}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* App Logo/Icon */}
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={['#16a34a', '#22c55e', '#4ade80']}
                        style={styles.logoGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.logoEmoji}>💚</Text>
                    </LinearGradient>
                </View>

                {/* App Name */}
                <Text style={[styles.appName, isDark && styles.appNameDark]}>
                    Healify
                </Text>

                {/* Tagline */}
                <Text style={[styles.tagline, isDark && styles.taglineDark]}>
                    Your Health, Powered by AI
                </Text>

                {/* LifeLine Loading Indicator */}
                <View style={styles.loaderContainer}>
                    <LifeLine color="#29a929" size="medium" text="" textColor="" />
                </View>

                {/* Loading Message */}
                <Text style={[styles.message, isDark && styles.messageDark]}>
                    {message}
                </Text>

                {/* Progress Bar */}
                {showProgress && (
                    <View style={[styles.progressContainer, isDark && styles.progressContainerDark]}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                { width: `${Math.min(100, Math.max(0, progress))}%` },
                            ]}
                        />
                    </View>
                )}
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        marginBottom: 24,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoEmoji: {
        fontSize: 48,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 8,
        letterSpacing: 1,
    },
    appNameDark: {
        color: '#ffffff',
    },
    tagline: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 32,
        letterSpacing: 0.5,
    },
    taglineDark: {
        color: '#9ca3af',
    },
    loaderContainer: {
        marginBottom: 24,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        fontSize: 16,
        color: '#4b5563',
        marginBottom: 24,
    },
    messageDark: {
        color: '#d1d5db',
    },
    progressContainer: {
        width: SCREEN_WIDTH * 0.6,
        height: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressContainerDark: {
        backgroundColor: '#374151',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#16a34a',
        borderRadius: 3,
    },
});

export default LoadingScreen;
