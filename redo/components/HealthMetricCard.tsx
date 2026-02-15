import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';

interface HealthMetricCardProps {
    title: string;
    value: string;
    unit: string;
    icon: string;
    gradientColors: [string, string];
    trend: 'up' | 'down' | 'stable';
    trendValue: string;
}

export default function HealthMetricCard({
    title,
    value,
    unit,
    icon,
    gradientColors,
    trend,
    trendValue
}: HealthMetricCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return '↗️';
            case 'down': return '↘️';
            case 'stable': return '→';
            default: return '→';
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up': return isDark ? '#4ade80' : '#16a34a';
            case 'down': return isDark ? '#f87171' : '#dc2626';
            case 'stable': return isDark ? '#9ca3af' : '#4b5563';
            default: return isDark ? '#9ca3af' : '#4b5563';
        }
    };

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={gradientColors}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {title}
                    </Text>
                    <Text style={styles.icon}>
                        {icon}
                    </Text>
                </View>

                <Text style={styles.value}>
                    {value}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.unit}>
                        {unit}
                    </Text>
                    <View style={styles.trendContainer}>
                        <Text style={styles.trendIcon}>
                            {getTrendIcon()}
                        </Text>
                        <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                            {trendValue}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '48%',
        marginBottom: 16,
    },
    container: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    title: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'BricolageGrotesque',
    },
    icon: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 18,
    },
    value: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'BricolageGrotesque',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    unit: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendIcon: {
        color: 'white',
        fontSize: 12,
        marginRight: 4,
    },
    trendValue: {
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
});
