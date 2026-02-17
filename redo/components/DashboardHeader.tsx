import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface DashboardHeaderProps {
    userName: string;
    lastSyncTime: string;
}

export function DashboardHeader({ userName, lastSyncTime }: DashboardHeaderProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    // Unified Gradient: Indigo -> Violet
    // Dark mode: Deeper/Rich
    // Light mode: Vibrant but mature
    const gradientColors = isDark
        ? ['#312e81', '#4c1d95'] as const // indigo-900 -> violet-900
        : ['#4f46e5', '#7c3aed'] as const; // indigo-600 -> violet-600

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.topRow}>
                <View style={styles.userInfo}>
                    <Text style={styles.welcomeText}>
                        Welcome back,
                    </Text>
                    <Text style={styles.userNameText}>
                        {userName}
                    </Text>
                    <View style={styles.syncContainer}>
                        <View style={[styles.syncDot, { backgroundColor: '#4ade80' }]} />
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
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Streak</Text>
                    <Text style={styles.statValue}>12 <Text style={styles.statUnit}>days</Text></Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Goal</Text>
                    <Text style={styles.statValue}>85<Text style={styles.statUnit}>%</Text></Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Sleep</Text>
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
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    userInfo: {
        flex: 1,
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        fontFamily: 'BricolageGrotesque',
    },
    userNameText: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'BricolageGrotesque',
        letterSpacing: -0.5,
    },
    syncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    syncDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    syncText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
    },
    notificationButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    notificationIcon: {
        fontSize: 20,
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: '#4f46e5',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 16,
        padding: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        marginBottom: 2,
        fontFamily: 'BricolageGrotesque',
    },
    statValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    statUnit: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.6)',
    },
});
