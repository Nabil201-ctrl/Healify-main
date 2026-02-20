import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
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
                console.log('Failed to fetch activity data, no mock data fallback');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!data || !data.datasets || data.datasets.length === 0) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <Text style={{ color: colors.tabIconDefault }}>No activity data available</Text>
            </View>
        );
    }

    // Transform the dataset format (chart-kit style) to gifted-charts style
    const maxValue = data?.datasets?.[0]?.data?.length ? Math.max(...data.datasets[0].data) : 0;
    const chartData = data?.datasets?.[0]?.data?.map((val: number, index: number) => ({
        value: val,
        label: data.labels?.[index] || '',
        frontColor: isDark ? '#818cf8' : '#4f46e5', // Indigo
        topLabelComponent: () => (
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 10, marginBottom: 4 }}>
                {val > 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </Text>
        )
    })) || [];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>⚡ Daily Steps</Text>
                <Text style={[styles.subtitle, { color: isDark ? '#60a5fa' : '#2563eb' }]}>This Week</Text>
            </View>

            <View style={{ marginBottom: 16 }}>
                <BarChart
                    data={chartData}
                    barWidth={chartWidth > 350 ? 24 : 18}
                    spacing={chartWidth > 350 ? 20 : 16}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: 'transparent' }} // Hide Y axis texts because we have top labels
                    noOfSections={4}
                    maxValue={maxValue * 1.2} // Give headroom for labels
                    backgroundColor="transparent"
                    xAxisLabelTextStyle={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    isAnimated
                />
            </View>

            <View style={styles.statsRow}>
                <StatItem label="Daily Avg" value={`${data.summary?.dailyAvg} steps`} isDark={isDark} />
                <StatItem label="Weekly Total" value={`${data.summary?.weeklyTotal} steps`} isDark={isDark} />
                <StatItem label="Goal" value={`${data.summary?.goal} steps/day`} isDark={isDark} />
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
