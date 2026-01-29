import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import tw from 'twrnc';
import { API_URL } from '../api/api';

interface ActivityChartProps {
    isDark?: boolean;
}

export default function ActivityChart({ isDark = false }: ActivityChartProps) {
    const { width } = useWindowDimensions();
    const chartWidth = width - 72;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/health/activity`);
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Failed to fetch activity data:', error);
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
    };

    if (loading || !data || !data.datasets) {
        return (
            <View style={tw`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} h-64 justify-center items-center`}>
                <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
                {!loading && !data?.datasets && <Text style={tw`text-gray-500 mt-2`}>No activity data available</Text>}
            </View>
        );
    }

    return (
        <View style={tw`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>⚡ Activity Minutes</Text>
                <Text style={tw`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} font-medium`}>This Week</Text>
            </View>

            <BarChart
                data={data}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                style={tw`rounded-xl -ml-4`}
                showValuesOnTopOfBars
                withCustomBarColorFromData
                flatColor
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
            />

            <View style={tw`flex-row justify-between mt-4`}>
                <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Daily Avg</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.summary?.dailyAvg} min</Text>
                </View>
                <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Weekly Total</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.summary?.weeklyTotal} min</Text>
                </View>
                <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Goal</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.summary?.goal} min/day</Text>
                </View>
            </View>
        </View>
    );
}