import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { API_URL } from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function SleepChart() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const chartWidth = width - 72;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/health/sleep`);
                if (!response.ok) throw new Error("Failed to fetch");
                const result = await response.json();

                // Add required styles for StackedBarChart directly into the result
                const formattedResult = {
                    ...result,
                    barColors: isDark
                        ? ['#6366f1', '#818cf8', '#a78bfa']
                        : ['#4f46e5', '#6366f1', '#8b5cf6'],
                    legend: ['Deep', 'Light', 'REM']
                };

                setData(formattedResult);
            } catch (error) {
                console.log('Failed to fetch sleep data, no mock data fallback');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isDark]);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!data || !data.data || data.data.length === 0) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <Text style={{ color: colors.tabIconDefault }}>No sleep data available</Text>
            </View>
        );
    }

    const sleepStackData = data?.data?.map((vals: number[], index: number) => ({
        stacks: [
            { value: vals[0] || 0, color: isDark ? '#6366f1' : '#4f46e5' }, // Deep
            { value: vals[1] || 0, color: isDark ? '#8b5cf6' : '#8b5cf6' }, // Light
            { value: vals[2] || 0, color: isDark ? '#a78bfa' : '#c084fc' }  // REM
        ],
        label: data.labels?.[index] || ''
    })) || [];

    const maxValue = data?.data?.length ? Math.max(...data.data.map((vals: number[]) => vals.reduce((a, b) => a + b, 0))) : 0;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>😴 Sleep Quality</Text>
                <Text style={[styles.subtitle, { color: isDark ? '#a78bfa' : '#9333ea' }]}>Last 7 Days</Text>
            </View>

            <View style={{ marginBottom: 16 }}>
                <BarChart
                    stackData={sleepStackData}
                    barWidth={chartWidth > 350 ? 24 : 18}
                    spacing={chartWidth > 350 ? 20 : 16}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    noOfSections={4}
                    maxValue={maxValue * 1.2 || 12}
                    backgroundColor="transparent"
                    xAxisLabelTextStyle={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    isAnimated
                />
            </View>

            <View style={styles.legendRow}>
                <LegendItem color={isDark ? '#6366f1' : '#4f46e5'} label="Deep" isDark={isDark} />
                <LegendItem color={isDark ? '#8b5cf6' : '#8b5cf6'} label="Light" isDark={isDark} />
                <LegendItem color={isDark ? '#a78bfa' : '#c084fc'} label="REM" isDark={isDark} />
            </View>

            <View style={styles.statsRow}>
                <StatItem label="Last Night" value={data.lastNight?.duration || '--'} color={colors.text} isDark={isDark} />
                <StatItem label="Quality" value={data.lastNight?.quality || '--'} color={isDark ? '#4ade80' : '#16a34a'} isDark={isDark} />
                <StatItem label="Bedtime" value={data.lastNight?.bedtime || '--'} color={colors.text} isDark={isDark} />
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
    loadingContainer: {
        height: 256,
        justifyContent: 'center',
        alignItems: 'center',
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
