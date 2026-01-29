import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';

interface DashboardHeaderProps {
    userName: string;
    lastSyncTime: string;
    isDark?: boolean;
}

export function DashboardHeader({ userName, lastSyncTime, isDark = false }: DashboardHeaderProps) {
    const gradientColors = isDark ? ['#4f46e5', '#7c3aed'] : ['#6366f1', '#8b5cf6'];

    return (
        <LinearGradient
            colors={gradientColors}
            style={tw`rounded-3xl p-6 mb-6 shadow-lg`}
        >
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-white text-sm font-medium mb-1`}>
                        Welcome back,
                    </Text>
                    <Text style={tw`text-white text-2xl font-bold mb-2`}>
                        {userName}!
                    </Text>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`w-2 h-2 ${isDark ? 'bg-green-500' : 'bg-green-400'} rounded-full mr-2`} />
                        <Text style={tw`text-white text-opacity-90 text-sm`}>
                            Synced {lastSyncTime}
                        </Text>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={tw`bg-white bg-opacity-20 w-10 h-10 rounded-full items-center justify-center`}
                    activeOpacity={0.7}
                >
                    <Text style={tw`text-white text-lg`}>🔔</Text>
                </TouchableOpacity>
            </View>
            
            <View style={tw`flex-row justify-between mt-4`}>
                <View style={tw`items-center`}>
                    <Text style={tw`text-white text-xs opacity-90`}>Current Streak</Text>
                    <Text style={tw`text-white text-lg font-bold`}>12 days</Text>
                </View>
                <View style={tw`items-center`}>
                    <Text style={tw`text-white text-xs opacity-90`}>Weekly Goal</Text>
                    <Text style={tw`text-white text-lg font-bold`}>85%</Text>
                </View>
                <View style={tw`items-center`}>
                    <Text style={tw`text-white text-xs opacity-90`}>Sleep Score</Text>
                    <Text style={tw`text-white text-lg font-bold`}>87</Text>
                </View>
            </View>
        </LinearGradient>
    );
}