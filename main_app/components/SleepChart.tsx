import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import tw from 'twrnc';

interface SleepChartProps {
    isDark?: boolean;
}

export default function SleepChart({ isDark = false }: SleepChartProps) {
    const { width } = useWindowDimensions();
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
    };

    return (
        <View style={tw`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>😴 Sleep Quality</Text>
                <Text style={tw`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'} font-medium`}>Last 7 Days</Text>
            </View>
            
            <StackedBarChart
                data={sleepData}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                style={tw`rounded-xl -ml-4`}
                hideLegend={false}
            />
            
            <View style={tw`flex-row justify-between mt-4`}>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-3 h-3 ${isDark ? 'bg-indigo-500' : 'bg-indigo-600'} rounded mr-2`} />
                    <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Deep</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-3 h-3 ${isDark ? 'bg-purple-400' : 'bg-purple-500'} rounded mr-2`} />
                    <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Light</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-3 h-3 ${isDark ? 'bg-purple-300' : 'bg-purple-300'} rounded mr-2`} />
                    <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>REM</Text>
                </View>
            </View>
            
            <View style={tw`flex-row justify-between mt-4`}>
                <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last Night</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>7h 30m</Text>
                </View>
                <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quality</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>85%</Text>
                </View>
                <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bedtime</Text>
                    <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>10:45 PM</Text>
                </View>
            </View>
        </View>
    );
}