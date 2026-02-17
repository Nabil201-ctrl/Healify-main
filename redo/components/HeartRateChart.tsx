import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { API_URL } from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function HeartRateChart() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const chartWidth = width - 72; // Adjust based on padding
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/health/heart-rate`);
                if (!response.ok) throw new Error("Failed to fetch");
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.log('Failed to fetch heart rate data, using mock data');
                // Mock data fallback if API fails (since API might not be running or accessible)
                setData({
                    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
                    datasets: [{ data: [65, 58, 72, 85, 78, 68] }],
                    stats: { min: 58, avg: 71, max: 85, resting: 62 }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartConfig = {
        backgroundColor: isDark ? '#1e293b' : '#ffffff', // Slate 800 or White
        backgroundGradientFrom: isDark ? '#1e293b' : '#ffffff',
        backgroundGradientTo: isDark ? '#1e293b' : '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo 500
        labelColor: (opacity = 1) => isDark
            ? `rgba(148, 163, 184, ${opacity})` // Slate 400
            : `rgba(100, 116, 139, ${opacity})`, // Slate 500
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#6366f1', // Indigo 500
        },
        propsForLabels: {
            fontFamily: 'BricolageGrotesque',
        },
        propsForBackgroundLines: {
            stroke: isDark ? '#334155' : '#e2e8f0', // Slate 700 / 200
            strokeWidth: 1,
        },
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ActivityIndicator size="large" color="#ec4899" />
            </View>
        );
    }

    if (!data || !data.datasets) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <Text style={{ color: colors.tabIconDefault }}>No heart rate data available</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>❤️ Heart Rate</Text>
                <View style={styles.legendContainer}>
                    <View style={[styles.legendDot, { backgroundColor: '#ec4899' }]} />
                    <Text style={[styles.legendText, { color: colors.tabIconDefault }]}>Today</Text>
                </View>
            </View>

            <LineChart
                data={data}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={false}
                withInnerLines={false}
                withOuterLines={false}
            />

            <View style={styles.statsRow}>
                <StatItem label="Min" value={`${data.stats?.min} bpm`} isDark={isDark} />
                <StatItem label="Avg" value={`${data.stats?.avg} bpm`} isDark={isDark} />
                <StatItem label="Max" value={`${data.stats?.max} bpm`} isDark={isDark} />
                <StatItem label="Resting" value={`${data.stats?.resting} bpm`} isDark={isDark} />
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
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        fontFamily: 'BricolageGrotesque',
    },
    chart: {
        borderRadius: 16,
        marginLeft: -16, // Offset to align with container padding
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statItem: {
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
