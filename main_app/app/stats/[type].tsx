import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

// Mock Data Generators
const generateData = (type: string) => {
    const isSteps = type === 'steps';
    const isCalories = type === 'calories';
    const isDistance = type === 'distance';

    // Labels (Time)
    const labels = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];

    // Graph Data
    let data = [0, 0, 0, 0, 0, 0];
    if (isSteps) data = [500, 1200, 3500, 5000, 7000, 8500];
    if (isCalories) data = [50, 150, 400, 650, 900, 1100];
    if (isDistance) data = [0.5, 1.2, 3.5, 4.8, 6.2, 7.5];

    // List History Data
    const history = Array.from({ length: 10 }).map((_, i) => ({
        id: i.toString(),
        timestamp: `${8 + i}:00 AM`,
        value: isSteps ? Math.floor(Math.random() * 1000) + 100 :
            isCalories ? Math.floor(Math.random() * 100) + 50 :
                (Math.random() * 2).toFixed(2),
        unit: isSteps ? 'steps' : isCalories ? 'kcal' : 'km',
        title: isSteps ? 'Morning Walk' : isCalories ? 'Active Burn' : 'Run',
        icon: isSteps ? 'footsteps' : isCalories ? 'flame' : 'map',
    }));

    return { labels, data, history };
};

export default function StatsDetailsScreen() {
    const { type } = useLocalSearchParams<{ type: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();

    const metricType = type || 'steps';
    const { labels, data, history } = generateData(metricType);

    const getTitle = () => {
        switch (metricType) {
            case 'steps': return 'Step Count';
            case 'calories': return 'Calories Burned';
            case 'distance': return 'Distance Covered';
            default: return 'Activity Stats';
        }
    };

    const getColor = () => {
        switch (metricType) {
            case 'steps': return colors.steps;
            case 'calories': return colors.activityRing;
            case 'distance': return colors.distance;
            default: return colors.primary;
        }
    };

    const themeColor = getColor();

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const renderItem = ({ item }: { item: any }) => (
        <View style={[tw`flex-row items-center justify-between p-4 rounded-2xl mb-3`, { backgroundColor: colors.card }]}>
            <View style={tw`flex-row items-center`}>
                <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: `${themeColor}20` }]}>
                    <Ionicons name={item.icon} size={20} color={themeColor} />
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
                <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>{getTitle()}</Text>
                <View style={tw`w-10`} />
            </View>

            <ScrollView contentContainerStyle={tw`pb-10 px-4`}>
                {/* Overhead Graph */}
                <View style={tw`items-center justify-center my-6`}>
                    <LineChart
                        data={{
                            labels: labels,
                            datasets: [{ data: data }]
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
                            color: (opacity = 1) => themeColor,
                            labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: themeColor
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                </View>

                {/* Summary Cards */}
                <View style={tw`flex-row justify-between mb-6`}>
                    <View style={[tw`flex-1 p-4 rounded-2xl mr-2`, { backgroundColor: colors.card }]}>
                        <Text style={[tw`text-xs uppercase mb-1`, { color: colors.textSecondary }]}>Total</Text>
                        <Text style={[tw`text-2xl font-bold`, { color: themeColor }]}>
                            {data[data.length - 1]}
                        </Text>
                    </View>
                    <View style={[tw`flex-1 p-4 rounded-2xl ml-2`, { backgroundColor: colors.card }]}>
                        <Text style={[tw`text-xs uppercase mb-1`, { color: colors.textSecondary }]}>Avg</Text>
                        <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>
                            {Math.round(data.reduce((a, b) => a + b, 0) / data.length)}
                        </Text>
                    </View>
                </View>

                {/* History List Header */}
                <View style={tw`mb-2`}>
                    <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>History</Text>
                </View>

                {/* List */}
                <View>
                    {history.map((item) => (
                        <View key={item.id}>
                            {renderItem({ item })}
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}
