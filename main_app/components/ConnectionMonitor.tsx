import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import tw from 'twrnc';

/**
 * Connection Monitor component
 * Displays a banner when the device is offline
 * Monitors network connectivity and shows status to users
 */
export const ConnectionMonitor: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [slideAnim] = useState(new Animated.Value(-100));

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected && state.isInternetReachable !== false;
            setIsConnected(connected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isConnected === false) {
            // Slide down the banner
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else if (isConnected === true) {
            // Slide up the banner
            Animated.spring(slideAnim, {
                toValue: -100,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        }
    }, [isConnected, slideAnim]);

    if (isConnected === null) {
        // Still checking connection status
        return null;
    }

    return (
        <Animated.View
            style={[
                tw`absolute top-0 left-0 right-0 z-50`,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={tw`bg-red-600 px-4 py-3 flex-row items-center justify-center`}>
                <Text style={tw`text-white font-semibold text-sm`}>
                    ⚠️ No internet connection
                </Text>
            </View>
        </Animated.View>
    );
};

export default ConnectionMonitor;
