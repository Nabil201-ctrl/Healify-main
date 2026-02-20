import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
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
                console.log('Failed to fetch heart rate data, no mock data fallback');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ActivityIndicator size="large" color="#ec4899" />
            </View>
        );
    }

    if (!data || !data.datasets || data.datasets.length === 0) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <Text style={{ color: colors.tabIconDefault }}>No heart rate data available</Text>
            </View>
        );
    }

    // Transform the dataset format (chart-kit style) to gifted-charts style
    const chartData = data?.datasets?.[0]?.data?.map((val: number, index: number) => ({
        value: val,
        label: data.labels?.[index] || '',
        dataPointText: val.toString()
    })) || [];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>❤️ Heart Rate</Text>
                <View style={styles.legendContainer}>
                    <View style={[styles.legendDot, { backgroundColor: '#ec4899' }]} />
                    <Text style={[styles.legendText, { color: colors.tabIconDefault }]}>Today</Text>
                </View>
            </View>

            <View style={{ marginBottom: 16 }}>
                <LineChart
                    data={chartData}
                    width={chartWidth - 20}
                    height={200}
                    isAnimated
                    curved
                    color="#ec4899"
                    thickness={3}
                    startFillColor="#ec4899"
                    endFillColor="#ec4899"
                    startOpacity={isDark ? 0.3 : 0.2}
                    endOpacity={0.05}
                    areaChart
                    initialSpacing={10}
                    stepHeight={40}
                    yAxisColor="transparent"
                    xAxisColor={isDark ? '#374151' : '#e5e7eb'}
                    rulesColor={isDark ? '#374151' : '#f3f4f6'}
                    yAxisTextStyle={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    xAxisLabelTextStyle={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    dataPointsColor="#ec4899"
                    dataPointsRadius={4}
                    hideRules={false}
                    pointerConfig={{
                        pointerStripColor: isDark ? '#9ca3af' : '#d1d5db',
                        pointerStripWidth: 2,
                        pointerColor: isDark ? '#f472b6' : '#db2777',
                        radius: 6,
                        pointerLabelWidth: 80,
                        pointerLabelHeight: 30,
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View
                                    style={{
                                        height: 30,
                                        width: 80,
                                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                        borderRadius: 8,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 4,
                                        elevation: 4
                                    }}>
                                    <Text style={{ color: isDark ? '#fff' : '#111827', fontSize: 13, fontWeight: 'bold' }}>
                                        {items[0].value} bpm
                                    </Text>
                                </View>
                            );
                        },
                    }}
                />
            </View>

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
