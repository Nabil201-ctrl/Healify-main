import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    icon: string;
    color: string;
    read: boolean;
};

// ─── Icon / colour map ────────────────────────────────────────────────────────

const ICON_MAP: Record<string, { icon: string; color: string }> = {
    HIGH_HEART_RATE: { icon: 'heart', color: '#ef4444' },
    ACTIVITY_DROP: { icon: 'footsteps', color: '#f59e0b' },
    GOAL_REACHED: { icon: 'trophy', color: '#eab308' },
    SLEEP_REPORT: { icon: 'moon', color: '#8b5cf6' },
    HYDRATION: { icon: 'water', color: '#3b82f6' },
    NEW_FEATURE: { icon: 'star', color: '#ec4899' },
    HEALTH_UPDATE: { icon: 'pulse', color: '#10b981' },
    HEART_RATE_TREND: { icon: 'heart-circle', color: '#ef4444' },
    MEDICATION_REMINDER: { icon: 'medical', color: '#6366f1' },
    GENERAL: { icon: 'notifications', color: '#64748b' },
    default: { icon: 'notifications-outline', color: '#6366f1' },
};

function formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchNotifications = useCallback(async () => {
        try {
            setError(null);
            const res = await api.get('/users/notifications');
            const raw: any[] = res.data?.notifications ?? res.data ?? [];

            const mapped: Notification[] = raw.map((n: any) => {
                const iconCfg = ICON_MAP[n.type] ?? ICON_MAP.default;
                return {
                    id: n.id ?? n._id ?? String(Math.random()),
                    type: n.type ?? 'GENERAL',
                    title: n.title ?? 'Notification',
                    message: n.message ?? '',
                    time: formatTime(n.createdAt ?? n.timestamp),
                    icon: iconCfg.icon,
                    color: iconCfg.color,
                    read: n.read ?? false,
                };
            });

            setNotifications(mapped);
            setUnreadCount(res.data?.unreadCount ?? mapped.filter(n => !n.read).length);
        } catch (e: any) {
            console.warn('[Notifications] Failed to fetch:', e?.message);
            setError('Could not load notifications. Pull down to retry.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, [fetchNotifications]);

    // ── Mark single as read ───────────────────────────────────────────────────

    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await api.patch(`/users/notifications/${id}/read`);
        } catch (e) {
            // Revert if failed
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    // ── Mark all as read ─────────────────────────────────────────────────────

    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
            await api.patch('/users/notifications/read-all');
        } catch {
            fetchNotifications(); // re-sync on failure
        }
    }, [fetchNotifications]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                >
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                        <Text style={[styles.markAllText, { color: colors.tint }]}>Mark all read</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 80 }} />
                )}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : error ? (
                <View style={styles.centeredContainer}>
                    <Ionicons name="cloud-offline-outline" size={48} color={isDark ? '#4b5563' : '#d1d5db'} />
                    <Text style={[styles.errorText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>{error}</Text>
                    <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: colors.tint }]}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => !item.read && markAsRead(item.id)}
                            activeOpacity={item.read ? 1 : 0.7}
                            style={[
                                styles.notificationItem,
                                {
                                    backgroundColor: item.read
                                        ? (isDark ? '#111827' : '#f8fafc')
                                        : (isDark ? '#1e293b' : '#fff'),
                                    borderColor: item.read
                                        ? (isDark ? '#1e293b' : '#f1f5f9')
                                        : (isDark ? '#334155' : '#e2e8f0'),
                                },
                            ]}
                        >
                            {/* Icon */}
                            <View style={[
                                styles.iconContainer,
                                { backgroundColor: `${item.color}${item.read ? '12' : '20'}` }
                            ]}>
                                <Ionicons
                                    name={item.icon as any}
                                    size={22}
                                    color={item.read ? `${item.color}80` : item.color}
                                />
                            </View>

                            {/* Text */}
                            <View style={styles.textContainer}>
                                <View style={styles.itemHeader}>
                                    <Text
                                        style={[
                                            styles.itemTitle,
                                            {
                                                color: item.read
                                                    ? (isDark ? '#6b7280' : '#9ca3af')
                                                    : colors.text,
                                                fontWeight: item.read ? '500' : 'bold',
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.itemTime, { color: isDark ? '#4b5563' : '#d1d5db' }]}>
                                        {item.time}
                                    </Text>
                                </View>
                                <Text
                                    style={[styles.itemMessage, { color: isDark ? '#6b7280' : '#94a3b8' }]}
                                    numberOfLines={2}
                                >
                                    {item.message}
                                </Text>
                            </View>

                            {/* Unread dot */}
                            {!item.read && (
                                <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
                            )}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                                <Ionicons name="notifications-off-outline" size={40} color={isDark ? '#4b5563' : '#d1d5db'} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>All clear!</Text>
                            <Text style={[styles.emptySubtitle, { color: isDark ? '#6b7280' : '#94a3b8' }]}>
                                No notifications yet. We'll let you know when something happens.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    markAllBtn: {
        paddingHorizontal: 4,
    },
    markAllText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },

    listContent: { padding: 16 },

    notificationItem: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    textContainer: { flex: 1 },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    itemTitle: {
        fontSize: 15,
        fontFamily: 'BricolageGrotesque',
        flex: 1,
        marginRight: 8,
    },
    itemTime: {
        fontSize: 11,
        fontFamily: 'BricolageGrotesque',
        flexShrink: 0,
    },
    itemMessage: {
        fontSize: 13,
        lineHeight: 18,
        fontFamily: 'BricolageGrotesque',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 10,
        flexShrink: 0,
    },

    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
        fontFamily: 'BricolageGrotesque',
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'BricolageGrotesque',
    },

    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 32,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: 'BricolageGrotesque',
    },
});
