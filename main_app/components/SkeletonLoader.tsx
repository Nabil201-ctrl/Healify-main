import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, useColorScheme, StyleSheet } from 'react-native';
import tw from 'twrnc';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

/**
 * Animated skeleton loader with shimmer effect.
 * Use for content placeholders while data is loading.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                {
                    width: typeof width === 'number' ? width : width,
                    height,
                    borderRadius,
                    backgroundColor: isDark ? '#374151' : '#e5e7eb',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(255, 255, 255, 0.5)',
                            width: 100,
                        },
                    ]}
                />
            </Animated.View>
        </View>
    );
};

interface SkeletonCardProps {
    isDark?: boolean;
}

/**
 * Pre-built skeleton for health metric cards.
 * Matches the layout of HealthMetricCard component.
 */
export const HealthMetricSkeleton: React.FC<SkeletonCardProps> = ({ isDark }) => {
    const colorScheme = useColorScheme();
    const dark = isDark ?? colorScheme === 'dark';

    return (
        <View
            style={[
                styles.metricCard,
                { backgroundColor: dark ? '#1f2937' : '#ffffff' },
            ]}
        >
            <Skeleton
                width={44}
                height={44}
                borderRadius={22}
                style={styles.metricIcon}
            />
            <Skeleton width="50%" height={14} style={styles.metricTitle} />
            <Skeleton width="70%" height={28} style={styles.metricValue} />
            <Skeleton width="40%" height={12} />
        </View>
    );
};

/**
 * Pre-built skeleton for chart components.
 * Provides a placeholder for HeartRateChart, ActivityChart, or SleepChart.
 */
export const ChartSkeleton: React.FC<SkeletonCardProps> = ({ isDark }) => {
    const colorScheme = useColorScheme();
    const dark = isDark ?? colorScheme === 'dark';

    return (
        <View
            style={[
                styles.chartCard,
                { backgroundColor: dark ? '#1f2937' : '#ffffff' },
            ]}
        >
            <View style={styles.chartHeader}>
                <Skeleton width="40%" height={20} />
                <Skeleton width={60} height={24} borderRadius={12} />
            </View>
            <Skeleton width="100%" height={200} borderRadius={12} style={styles.chartArea} />
            <View style={styles.chartLegend}>
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} width={60} height={12} style={styles.legendItem} />
                ))}
            </View>
        </View>
    );
};

/**
 * Pre-built skeleton for vital signs section.
 */
export const VitalSkeleton: React.FC<SkeletonCardProps> = ({ isDark }) => {
    const colorScheme = useColorScheme();
    const dark = isDark ?? colorScheme === 'dark';

    return (
        <View
            style={[
                styles.vitalCard,
                { backgroundColor: dark ? '#1f2937' : '#ffffff' },
            ]}
        >
            <Skeleton width="50%" height={18} style={styles.vitalTitle} />
            <View style={styles.vitalRow}>
                {[1, 2].map((i) => (
                    <View key={i} style={styles.vitalItem}>
                        <Skeleton width={48} height={48} borderRadius={24} />
                        <Skeleton width="80%" height={14} style={styles.vitalLabel} />
                        <Skeleton width="60%" height={20} />
                    </View>
                ))}
            </View>
        </View>
    );
};

/**
 * Dashboard loading skeleton that combines all skeleton components.
 * Use this as a full-page loading state for the home dashboard.
 */
export const DashboardSkeleton: React.FC<SkeletonCardProps> = ({ isDark }) => {
    const colorScheme = useColorScheme();
    const dark = isDark ?? colorScheme === 'dark';

    return (
        <View style={[styles.dashboard, { backgroundColor: dark ? '#111827' : '#f9fafb' }]}>
            {/* Header skeleton */}
            <View style={styles.header}>
                <View>
                    <Skeleton width={120} height={16} style={styles.headerGreeting} />
                    <Skeleton width={180} height={24} />
                </View>
                <Skeleton width={48} height={48} borderRadius={24} />
            </View>

            {/* Metrics grid */}
            <View style={styles.metricsGrid}>
                {[1, 2, 3, 4].map((i) => (
                    <HealthMetricSkeleton key={i} isDark={dark} />
                ))}
            </View>

            {/* Chart skeleton */}
            <ChartSkeleton isDark={dark} />

            {/* Vitals skeleton */}
            <VitalSkeleton isDark={dark} />
        </View>
    );
};

const styles = StyleSheet.create({
    // Metric Card styles
    metricCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    metricIcon: {
        marginBottom: 12,
    },
    metricTitle: {
        marginBottom: 8,
    },
    metricValue: {
        marginBottom: 8,
    },

    // Chart Card styles
    chartCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartArea: {
        marginBottom: 12,
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    legendItem: {
        marginHorizontal: 8,
    },

    // Vital Card styles
    vitalCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    vitalTitle: {
        marginBottom: 16,
    },
    vitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    vitalItem: {
        alignItems: 'center',
        width: '45%',
    },
    vitalLabel: {
        marginTop: 8,
        marginBottom: 4,
    },

    // Dashboard styles
    dashboard: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerGreeting: {
        marginBottom: 8,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
});

export default Skeleton;
