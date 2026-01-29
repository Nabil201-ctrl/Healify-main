import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import tw from 'twrnc';
import { API_URL } from '../api/api';

interface HeartRateChartProps {
    isDark?: boolean;
}

export function HeartRateChart({ isDark = false }: HeartRateChartProps) {
    const { width } = useWindowDimensions();
    const chartWidth = width - 72;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/health/heart-rate`);
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Failed to fetch heart rate data:', error);
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
            ? `rgba(236, 72, 153, ${opacity})`
            : `rgba(236, 72, 153, ${opacity})`,
        labelColor: (opacity = 1) => isDark
            ? `rgba(209, 213, 219, ${opacity})`
            : `rgba(107, 114, 128, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: isDark ? '#ec4899' : '#ec4899',
        },
        propsForBackgroundLines: {
            stroke: isDark ? '#374151' : '#e5e7eb',
            strokeWidth: 1,
        },
    };

    if (loading || !data || !data.datasets) {
        return (
            <View style={tw`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} h-64 justify-center items-center`}>
                <ActivityIndicator size="large" color={isDark ? '#ec4899' : '#ec4899'} />
                {!loading && !data?.datasets && <Text style={tw`text-gray-500 mt-2`}>No heart rate data available</Text>}
            </View>
        );
    }

    return (
        <View style={tw`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>❤️ Heart Rate</Text>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-3 h-3 ${isDark ? 'bg-pink-400' : 'bg-pink-500'} rounded-full mr-2`} />
                    <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Today</Text>
                </View>
            </View>

            <LineChart
                data={data}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={tw`rounded-xl -ml-4`}
                withVerticalLines={false}
                withHorizontalLines={false}
                withInnerLines={false}
                withOuterLines={false}
            />

            <View style={tw`flex-row justify-between mt-4`}>
                <View style={tw`items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Min</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.stats?.min} bpm</Text>
                </View>
                <View style={tw`items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.stats?.avg} bpm</Text>
                </View>
                <View style={tw`items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Max</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.stats?.max} bpm</Text>
                </View>
                <View style={tw`items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resting</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.stats?.resting} bpm</Text>
                </View>
            </View>
        </View>
    );
}