import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface HealthMetricCardProps {
    title: string;
    value: string;
    unit: string;
    icon: keyof typeof Ionicons.glyphMap;
    accentColor: string; // Color for icon/trend, not background
    trend: 'up' | 'down' | 'stable';
    trendValue: string;
}

export default function HealthMetricCard({
    title,
    value,
    unit,
    icon,
    accentColor,
    trend,
    trendValue
}: HealthMetricCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return 'arrow-up';
            case 'down': return 'arrow-down';
            case 'stable': return 'arrow-forward';
            default: return 'arrow-forward';
        }
    };

    const getTrendColor = () => {
        // We can use the accent color for the trend too, or standard semantic colors
        switch (trend) {
            case 'up': return colors.success;
            case 'down': return colors.error;
            case 'stable': return colors.textSecondary;
            default: return colors.textSecondary;
        }
    };

    return (
        <View style={styles.wrapper}>
            <View style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                }
            ]}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? `${accentColor}20` : `${accentColor}10` }]}>
                        <Ionicons name={icon} size={24} color={accentColor} />
                    </View>
                    <View style={[styles.trendBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Ionicons name={getTrendIcon()} size={14} color={getTrendColor()} style={{ marginRight: 4 }} />
                        <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                            {trendValue}
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.textSecondary }]}>
                        {title}
                    </Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                        {value}
                    </Text>
                    <Text style={[styles.unit, { color: colors.textSecondary }]}>
                        {unit}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '48%',
        marginBottom: 16,
    },
    container: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        height: 160,
        justifyContent: 'space-between',
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    trendValue: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },
    content: {
        marginTop: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        fontFamily: 'BricolageGrotesque',
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
        fontFamily: 'BricolageGrotesque',
    },
    unit: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
    },
});
