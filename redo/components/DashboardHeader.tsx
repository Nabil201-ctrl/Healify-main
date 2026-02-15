import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface DashboardHeaderProps {
    userName: string;
    lastSyncTime: string;
    isDark?: boolean;
}

export function DashboardHeader({ userName, lastSyncTime }: DashboardHeaderProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const gradientColors = isDark ? ['#4f46e5', '#7c3aed'] as const : ['#6366f1', '#8b5cf6'] as const;

    return (
        <LinearGradient
            colors={gradientColors}
            style={styles.container}
        >
            <View style={styles.topRow}>
                <View style={styles.userInfo}>
                    <Text style={styles.welcomeText}>
                        Welcome back,
                    </Text>
                    <Text style={styles.userNameText}>
                        {userName}!
                    </Text>
                    <View style={styles.syncContainer}>
                        <View style={[styles.syncDot, { backgroundColor: isDark ? '#22c55e' : '#4ade80' }]} />
                        <Text style={styles.syncText}>
                            Synced {lastSyncTime}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.notificationButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.notificationIcon}>🔔</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Current Streak</Text>
                    <Text style={styles.statValue}>12 days</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Weekly Goal</Text>
                    <Text style={styles.statValue}>85%</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Sleep Score</Text>
                    <Text style={styles.statValue}>87</Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        flex: 1,
    },
    welcomeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        fontFamily: 'BricolageGrotesque',
    },
    userNameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'BricolageGrotesque',
    },
    syncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    syncText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
    },
    notificationButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        color: 'white',
        fontSize: 18,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
    },
    statValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
});
