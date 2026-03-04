import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface DashboardHeaderProps {
    userName: string;
    lastSyncTime: string;
    streak?: number;
    goal?: number;
    sleepScore?: number | string;
    onNotificationPress?: () => void;
}

export function DashboardHeader({ userName, lastSyncTime, streak = 0, goal = 0, sleepScore = '--', onNotificationPress }: DashboardHeaderProps) {
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
                    activeOpacity={0.75}
                    onPress={onNotificationPress}
                >
                    <Ionicons name="notifications" size={22} color="rgba(255,255,255,0.95)" />
                    {/* Red badge dot */}
                    <View style={styles.notificationBadge}>
                        <View style={styles.notificationBadgeInner} />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Streak</Text>
                    <Text style={styles.statValue}>{streak} <Text style={styles.statUnit}>days</Text></Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Goal</Text>
                    <Text style={styles.statValue}>{goal}<Text style={styles.statUnit}>%</Text></Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Sleep</Text>
                    <Text style={styles.statValue}>{sleepScore}</Text>
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
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    notificationBadge: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
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
