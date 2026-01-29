import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import tw from 'twrnc';

interface VitalSignsSectionProps {
    isDark?: boolean;
}

export function VitalSignsSection({ isDark = false }: VitalSignsSectionProps) {
    const vitalSigns = [
        {
            title: 'Blood Pressure',
            value: '120/80',
            unit: 'mmHg',
            status: 'Normal',
            statusColor: isDark ? 'text-green-400' : 'text-green-600',
            icon: '💓',
            trend: 'stable',
        },
        {
            title: 'Blood Oxygen',
            value: '98',
            unit: '% SpO2',
            status: 'Excellent',
            statusColor: isDark ? 'text-green-400' : 'text-green-600',
            icon: '🌬️',
            trend: 'up',
        },
        {
            title: 'Respiratory Rate',
            value: '16',
            unit: 'breaths/min',
            status: 'Normal',
            statusColor: isDark ? 'text-green-400' : 'text-green-600',
            icon: '🌪️',
            trend: 'stable',
        },
        {
            title: 'Body Temp',
            value: '36.6',
            unit: '°C',
            status: 'Normal',
            statusColor: isDark ? 'text-green-400' : 'text-green-600',
            icon: '🌡️',
            trend: 'stable',
        },
    ];

    return (
        <View style={tw`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>📊 Vital Signs</Text>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`pb-2`}
            >
                {vitalSigns.map((vital, index) => (
                    <View 
                        key={index}
                        style={tw`w-40 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 mr-3 ${
                            index === 0 ? 'ml-1' : ''
                        } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                        <View style={tw`flex-row justify-between items-start mb-2`}>
                            <Text style={tw`text-2xl`}>{vital.icon}</Text>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-2 h-2 ${isDark ? 'bg-green-500' : 'bg-green-500'} rounded-full mr-1`} />
                                <Text style={tw`text-xs ${isDark ? 'text-green-400' : 'text-green-600'} font-medium`}>
                                    {vital.trend === 'up' ? '↑' : vital.trend === 'down' ? '↓' : '→'}
                                </Text>
                            </View>
                        </View>
                        
                        <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{vital.title}</Text>
                        <Text style={tw`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>
                            {vital.value}
                        </Text>
                        <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>{vital.unit}</Text>
                        
                        <Text style={tw`text-xs ${vital.statusColor} font-medium`}>
                            {vital.status}
                        </Text>
                    </View>
                ))}
            </ScrollView>
            
            <View style={tw`mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                    Last updated: Today, 8:30 AM
                </Text>
            </View>
        </View>
    );
}