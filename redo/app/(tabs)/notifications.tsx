import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function NotificationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const notifications = [
        { id: '1', title: 'Hydration Alert', message: 'Time to drink water! Stay hydrated.', time: '10m ago', icon: 'water', color: '#3b82f6' },
        { id: '2', title: 'Goal Reached', message: 'You hit your daily step goal. Great job!', time: '1h ago', icon: 'trophy', color: '#eab308' },
        { id: '3', title: 'Sleep Report', message: 'Your sleep quality has improved by 10%.', time: '5h ago', icon: 'moon', color: '#8b5cf6' },
        { id: '4', title: 'New Feature', message: 'Check out the new detailed charts!', time: '1d ago', icon: 'star', color: '#ec4899' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* We don't need Stack.Screen here as it's a tab, but it doesn't hurt */}
            
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.notificationItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.iconContainer, { backgroundColor: isDark ? `${item.color}20` : `${item.color}10` }]}>
                            <Ionicons name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <View style={styles.itemHeader}>
                                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.itemTime, { color: colors.textSecondary }]}>{item.time}</Text>
                            </View>
                            <Text style={[styles.itemMessage, { color: colors.textSecondary }]}>{item.message}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: colors.textSecondary }}>No new notifications</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center the title
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Extra padding for tab bar
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    itemTime: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
    },
    itemMessage: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'BricolageGrotesque',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40
    }
});
