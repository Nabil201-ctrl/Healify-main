import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';

interface HealthMetricCardProps {
    title: string;
    value: string;
    unit: string;
    icon: string;
    gradientColors: string[];
    trend: 'up' | 'down' | 'stable';
    trendValue: string;
    isDark?: boolean;
}

export default function HealthMetricCard({ 
    title, 
    value, 
    unit, 
    icon, 
    gradientColors, 
    trend, 
    trendValue,
    isDark = false 
}: HealthMetricCardProps) {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return '↗️';
            case 'down': return '↘️';
            case 'stable': return '→';
            default: return '→';
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up': return isDark ? 'text-green-400' : 'text-green-600';
            case 'down': return isDark ? 'text-red-400' : 'text-red-600';
            case 'stable': return isDark ? 'text-gray-400' : 'text-gray-600';
            default: return isDark ? 'text-gray-400' : 'text-gray-600';
        }
    };

    return (
        <View style={tw`w-[48%] mb-4`}>
            <LinearGradient
                colors={gradientColors}
                style={tw`rounded-2xl p-4 shadow-sm`}
            >
                <View style={tw`flex-row justify-between items-start mb-2`}>
                    <Text style={tw`text-white text-opacity-90 text-xs font-medium`}>
                        {title}
                    </Text>
                    <Text style={tw`text-white text-opacity-90 text-lg`}>
                        {icon}
                    </Text>
                </View>
                
                <Text style={tw`text-white text-2xl font-bold mb-1`}>
                    {value}
                </Text>
                
                <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-white text-opacity-90 text-xs`}>
                        {unit}
                    </Text>
                    <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-white text-xs mr-1`}>
                            {getTrendIcon()}
                        </Text>
                        <Text style={tw`text-xs ${getTrendColor()}`}>
                            {trendValue}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}