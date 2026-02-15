import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { API_URL } from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ActivityChart() {
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
                const response = await fetch(`${API_URL}/health/activity`);
                if (!response.ok) throw new Error("Failed to fetch");
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.log('Failed to fetch activity data, using mock data');
                setData({
                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    datasets: [{ data: [30, 45, 28, 80, 50, 43, 60] }],
                    summary: { dailyAvg: 48, weeklyTotal: 336, goal: 60 }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartConfig = {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        backgroundGradientFrom: isDark ? '#1f2937' : '#ffffff',
        backgroundGradientTo: isDark ? '#374151' : '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => isDark
            ? `rgba(96, 165, 250, ${opacity})`
            : `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => isDark
            ? `rgba(209, 213, 219, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        barPercentage: 0.5,
        propsForBackgroundLines: {
            stroke: isDark ? '#374151' : '#e5e7eb',
            strokeWidth: 1,
        },
        propsForLabels: {
            fontFamily: 'BricolageGrotesque',
        },
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!data || !data.datasets) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <Text style={{ color: colors.tabIconDefault }}>No activity data available</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>⚡ Activity Minutes</Text>
                <Text style={[styles.subtitle, { color: isDark ? '#60a5fa' : '#2563eb' }]}>This Week</Text>
            </View>

            <BarChart
                data={data}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
                withCustomBarColorFromData={false}
                flatColor
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
            />

            <View style={styles.statsRow}>
                <StatItem label="Daily Avg" value={`${data.summary?.dailyAvg} min`} isDark={isDark} />
                <StatItem label="Weekly Total" value={`${data.summary?.weeklyTotal} min`} isDark={isDark} />
                <StatItem label="Goal" value={`${data.summary?.goal} min/day`} isDark={isDark} />
            </View>
        </View>
    );
}

const StatItem = ({ label, value, isDark }: { label: string, value: string, isDark: boolean }) => (
    <View style={styles.statItem}>
        <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1f2937' }]}>{value}</Text>
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
