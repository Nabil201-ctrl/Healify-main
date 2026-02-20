import React, { useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext';
import tw from 'twrnc';
import api from '../../api/api';

const { width } = Dimensions.get('window');

type HistoryEntry = {
    id: string;
    timestamp: string;
    value: string | number;
    unit: string;
    title: string;
    icon: string;
};

type StatsData = {
    labels: string[];
    data: number[];
    total: number;
    average: number;
    history: HistoryEntry[];
};

function metaForType(type: string): { title: string; unit: string; icon: string } {
    switch (type) {
        case 'steps': return { title: 'Step Count', unit: 'steps', icon: 'footsteps' };
        case 'calories': return { title: 'Calories Burned', unit: 'kcal', icon: 'flame' };
        case 'distance': return { title: 'Distance Covered', unit: 'km', icon: 'map' };
        default: return { title: 'Activity Stats', unit: '', icon: 'pulse' };
    }
}

function colorForType(type: string, colors: any): string {
    switch (type) {
        case 'steps': return colors.steps;
        case 'calories': return colors.activityRing;
        case 'distance': return colors.distance;
        default: return colors.primary;
    }
}

/**
 * Map backend /health/activity data into chart-friendly format for this screen.
 * Falls back gracefully if the endpoint returns unexpected shapes.
 */
function mapActivityToStatsData(type: string, backendData: any): StatsData {
    const datasets = backendData?.datasets?.[0]?.data ?? [];
    const labels = backendData?.labels ?? datasets.map((_: any, i: number) => `Day ${i + 1}`);
    const summary = backendData?.summary ?? {};

    let data: number[] = datasets.map(Number);
    if (data.length === 0) data = [0];

    // Scale dataset values for calories/distance if needed
    if (type === 'calories') {
        data = data.map((v: number) => Math.round(v * 0.04));
    }
    if (type === 'distance') {
        data = data.map((v: number) => parseFloat((v * 0.0008).toFixed(2)));
    }

    const total = data[data.length - 1] ?? 0;
    const average = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;

    // Build history rows from datasets
    const { unit, icon } = metaForType(type);
    const history: HistoryEntry[] = labels.map((label: string, i: number) => ({
        id: String(i),
        timestamp: label,
        value: data[i] ?? 0,
        unit,
        title: type === 'steps' ? 'Daily Steps' : type === 'calories' ? 'Active Burn' : 'Distance',
        icon,
    }));

    return { labels, data, total, average, history };
}

export default function StatsDetailsScreen() {
    const { type } = useLocalSearchParams<{ type: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();

    const metricType = type || 'steps';
    const { title } = metaForType(metricType);
    const themeColor = colorForType(metricType, colors);

    const [statsData, setStatsData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            // All step/calorie/distance stats come from the activity endpoint
            const res = await api.get('/health/activity');
            const mapped = mapActivityToStatsData(metricType, res.data);
            setStatsData(mapped);
        } catch (e: any) {
            console.error('[Stats] Failed to fetch:', e?.message);
            setError('Could not load data. Pull down to retry.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [metricType]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const { unit, icon } = metaForType(metricType);

    const renderItem = ({ item }: { item: HistoryEntry }) => (
        <View style={[tw`flex-row items-center justify-between p-4 rounded-2xl mb-3`, { backgroundColor: colors.card }]}>
            <View style={tw`flex-row items-center`}>
                <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: `${themeColor}20` }]}>
                    <Ionicons name={item.icon as any} size={20} color={themeColor} />
                </View>
                <View>
                    <Text style={[tw`font-semibold text-base`, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>{item.timestamp}</Text>
                </View>
            </View>
            <View>
                <Text style={[tw`font-bold text-base text-right`, { color: colors.text }]}>
                    {item.value} <Text style={[tw`text-xs font-normal`, { color: colors.textSecondary }]}>{item.unit}</Text>
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[tw`flex-1`, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={tw`pt-12 pb-4 px-4 flex-row items-center justify-between`}>
                <TouchableOpacity onPress={() => router.back()} style={[tw`p-2 rounded-full`, { backgroundColor: colors.card }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>{title}</Text>
                <View style={tw`w-10`} />
            </View>

            {loading ? (
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color={themeColor} />
                </View>
            ) : error ? (
                <ScrollView
                    contentContainerStyle={tw`flex-1 items-center justify-center p-8`}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />}
                >
                    <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
                    <Text style={[tw`text-center mt-3`, { color: colors.textSecondary }]}>{error}</Text>
                </ScrollView>
            ) : statsData ? (
                <ScrollView
                    contentContainerStyle={tw`pb-10 px-4`}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />}
                >
                    {/* Chart */}
                    <View style={tw`items-center justify-center my-6`}>
                        <LineChart
                            data={{
                                labels: statsData.labels,
                                datasets: [{ data: statsData.data.length > 0 ? statsData.data : [0] }]
                            }}
                            width={width - 32}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            yAxisInterval={1}
                            chartConfig={{
                                backgroundColor: colors.background,
                                backgroundGradientFrom: colors.card,
                                backgroundGradientTo: colors.card,
                                decimalPlaces: 0,
                                color: () => themeColor,
                                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: '4', strokeWidth: '2', stroke: themeColor },
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </View>

                    {/* Summary Cards */}
                    <View style={tw`flex-row justify-between mb-6`}>
                        <View style={[tw`flex-1 p-4 rounded-2xl mr-2`, { backgroundColor: colors.card }]}>
                            <Text style={[tw`text-xs uppercase mb-1`, { color: colors.textSecondary }]}>Total</Text>
                            <Text style={[tw`text-2xl font-bold`, { color: themeColor }]}>
                                {statsData.total} <Text style={[tw`text-sm font-normal`, { color: colors.textSecondary }]}>{unit}</Text>
                            </Text>
                        </View>
                        <View style={[tw`flex-1 p-4 rounded-2xl ml-2`, { backgroundColor: colors.card }]}>
                            <Text style={[tw`text-xs uppercase mb-1`, { color: colors.textSecondary }]}>Avg / Day</Text>
                            <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>
                                {statsData.average} <Text style={[tw`text-sm font-normal`, { color: colors.textSecondary }]}>{unit}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* History List */}
                    <View style={tw`mb-2`}>
                        <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>This Week</Text>
                    </View>

                    <View>
                        {statsData.history.map(item => (
                            <View key={item.id}>
                                {renderItem({ item })}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            ) : null}
        </View>
    );
}
