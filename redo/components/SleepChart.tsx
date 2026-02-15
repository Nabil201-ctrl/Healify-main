import React from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function SleepChart() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const chartWidth = width - 72;

    const sleepData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [
            [6, 1.5, 0.5], // Deep, Light, REM
            [5.5, 2, 0.5],
            [7, 1, 0.5],
            [6.5, 1.5, 0.5],
            [5, 2.5, 0.5],
            [8, 1, 1],
            [7.5, 1, 0.5],
        ],
        barColors: isDark ? ['#6366f1', '#8b5cf6', '#a78bfa'] : ['#4f46e5', '#8b5cf6', '#c084fc'],
        legend: ['Deep', 'Light', 'REM']
    };

    const chartConfig = {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        backgroundGradientFrom: isDark ? '#1f2937' : '#ffffff',
        backgroundGradientTo: isDark ? '#374151' : '#ffffff',
        decimalPlaces: 1,
        color: (opacity = 1) => isDark
            ? `rgba(209, 213, 219, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
        labelColor: (opacity = 1) => isDark
            ? `rgba(209, 213, 219, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForBackgroundLines: {
            stroke: isDark ? '#374151' : '#e5e7eb',
            strokeWidth: 1,
        },
        propsForLabels: {
            fontFamily: 'BricolageGrotesque',
        },
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>😴 Sleep Quality</Text>
                <Text style={[styles.subtitle, { color: isDark ? '#a78bfa' : '#9333ea' }]}>Last 7 Days</Text>
            </View>

            <StackedBarChart
                data={sleepData}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                hideLegend={true}
            />

            <View style={styles.legendRow}>
                <LegendItem color={isDark ? '#6366f1' : '#4f46e5'} label="Deep" isDark={isDark} />
                <LegendItem color={isDark ? '#8b5cf6' : '#8b5cf6'} label="Light" isDark={isDark} />
                <LegendItem color={isDark ? '#a78bfa' : '#c084fc'} label="REM" isDark={isDark} />
            </View>

            <View style={styles.statsRow}>
                <StatItem label="Last Night" value="7h 30m" color={colors.text} isDark={isDark} />
                <StatItem label="Quality" value="85%" color={isDark ? '#4ade80' : '#16a34a'} isDark={isDark} />
                <StatItem label="Bedtime" value="10:45 PM" color={colors.text} isDark={isDark} />
            </View>
        </View>
    );
}

const LegendItem = ({ color, label, isDark }: { color: string, label: string, isDark: boolean }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={[styles.legendLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>{label}</Text>
    </View>
);

const StatItem = ({ label, value, color, isDark }: { label: string, value: string, color: string, isDark: boolean }) => (
    <View style={styles.statItem}>
        <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'BricolageGrotesque',
    },
    chart: {
        borderRadius: 16,
        marginLeft: -16,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 4,
        marginRight: 8,
    },
    legendLabel: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
});
