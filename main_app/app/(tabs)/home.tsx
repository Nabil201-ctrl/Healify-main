import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Platform
} from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { HealthService } from '../../services/HealthService';

const { width } = Dimensions.get('window');



export default function Home() {
    const { user } = useAuthContext();
    const { colors, isDark } = useTheme();
    const router = useRouter();

    // Health stats state - fetched from Google Fit
    const [stats, setStats] = useState({
        calories: 0,
        steps: 0,
        distance: 0
    });
    const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false);

    // Initialize Google Fit and fetch data
    useEffect(() => {
        const initializeHealthData = async () => {
            if (Platform.OS === 'android') {
                console.log('[Home] Initializing Google Fit connection...');
                const authorized = await HealthService.authorize();
                setIsGoogleFitConnected(authorized);

                if (authorized) {
                    console.log('[Home] Google Fit connected, fetching daily stats...');
                    const dailyStats = await HealthService.getDailyStats();
                    setStats({
                        calories: Math.round(dailyStats.calories),
                        steps: dailyStats.steps,
                        distance: parseFloat((dailyStats.distance / 1000).toFixed(2)) // Convert to KM
                    });
                    console.log('[Home] Stats fetched:', dailyStats);

                    // Also log to backend
                    await HealthService.logData();
                } else {
                    console.log('[Home] Google Fit not authorized, using default values');
                }
            } else {
                console.log('[Home] Running on non-Android platform, Google Fit not available');
            }
        };

        initializeHealthData();
    }, []);

    // Date formatting
    const today = new Date();
    const dateString = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    // Chart Config Generators
    const getChartConfig = (color: string) => ({
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => color,
        strokeWidth: 2,
        barPercentage: 0.3,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => colors.textSecondary,
    });

    const CustomCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
        <View style={[tw`rounded-[1.5rem] p-4 mb-4`, { backgroundColor: colors.card }, style]}>
            {children}
        </View>
    );

    return (
        <View style={[tw`flex-1 pt-12`, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <ScrollView
                contentContainerStyle={tw`px-4 pb-32`}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <View>
                        <Text style={[tw`text-3xl font-bold tracking-tight`, { color: colors.text }]}>Summary</Text>
                        <Text style={[tw`text-sm font-medium`, { color: colors.textSecondary }]}>{dateString}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <View style={[tw`w-10 h-10 rounded-full overflow-hidden border`, { backgroundColor: colors.border, borderColor: colors.border }]}>
                            <View style={tw`flex-1 items-center justify-center`}>
                                <Text style={[tw`font-bold`, { color: colors.text }]}>
                                    {user?.firstName ? user.firstName[0] : 'U'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Activity Ring Card */}
                <TouchableOpacity onPress={() => router.push('/stats/calories')}>
                    <CustomCard style={tw`h-64 items-center justify-center relative`}>
                        <View style={tw`w-full flex-row justify-between absolute top-4 px-4 z-10`}>
                            <Text style={[tw`font-bold text-lg`, { color: colors.text }]}>Activity Ring</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </View>

                        {/* Ring */}
                        <ProgressChart
                            data={{
                                labels: ["Move"],
                                data: [Math.min(stats.calories / 300, 1)]
                            }}
                            width={width - 40}
                            height={200}
                            strokeWidth={24}
                            radius={70}
                            chartConfig={{
                                backgroundGradientFrom: colors.card,
                                backgroundGradientTo: colors.card,
                                color: (opacity = 1) => `rgba(250, 17, 79, ${opacity})`,
                                labelColor: () => `rgba(0,0,0,0)`,
                            }}
                            hideLegend={true}
                        />

                        <View style={tw`absolute right-8 top-24`}>
                            <Text style={[tw`text-base font-semibold`, { color: colors.text }]}>Move</Text>
                            <Text style={[tw`text-xl font-bold`, { color: colors.activityRing }]}>{stats.calories}/300 KCAL</Text>
                        </View>
                    </CustomCard>
                </TouchableOpacity>

                {/* Grid Section: Steps & Distance */}
                <View style={tw`flex-row justify-between mb-4`}>
                    {/* Step Count */}
                    <TouchableOpacity style={tw`flex-1 mr-2`} onPress={() => router.push('/stats/steps')}>
                        <CustomCard style={tw`h-48 justify-between overflow-hidden pb-0 mb-0`}>
                            <View style={tw`flex-row justify-between items-start`}>
                                <View>
                                    <Text style={[tw`font-semibold text-base`, { color: colors.text }]}>Step Count</Text>
                                    <Text style={[tw`text-xs mt-1`, { color: colors.textSecondary }]}>Today</Text>
                                    <Text style={[tw`text-3xl font-bold mt-1`, { color: colors.steps }]}>{stats.steps.toLocaleString()}</Text>
                                </View>
                                <Ionicons name="chevron-forward-circle" size={20} color={colors.textSecondary} />
                            </View>
                            <View style={tw`flex-row justify-between px-1 pb-4 mt-auto`}>
                                <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>Today</Text>
                                <Text style={[tw`text-[10px] font-semibold`, { color: colors.steps }]}>{stats.steps > 0 ? `${stats.steps.toLocaleString()} steps` : 'No data'}</Text>
                            </View>
                        </CustomCard>
                    </TouchableOpacity>

                    {/* Distance */}
                    <TouchableOpacity style={tw`flex-1 ml-2`} onPress={() => router.push('/stats/distance')}>
                        <CustomCard style={tw`h-48 justify-between overflow-hidden pb-0 mb-0`}>
                            <View style={tw`flex-row justify-between items-start`}>
                                <View>
                                    <Text style={[tw`font-semibold text-base`, { color: colors.text }]}>Step Distance</Text>
                                    <Text style={[tw`text-xs mt-1`, { color: colors.textSecondary }]}>Today</Text>
                                    <Text style={[tw`text-3xl font-bold mt-1`, { color: colors.distance }]}>{stats.distance > 0 ? `${stats.distance}KM` : '--'}</Text>
                                </View>
                                <Ionicons name="chevron-forward-circle" size={20} color={colors.textSecondary} />
                            </View>
                            <View style={tw`flex-row justify-between px-1 pb-4 mt-auto`}>
                                <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>Today</Text>
                                <Text style={[tw`text-[10px] font-semibold`, { color: colors.distance }]}>{stats.distance > 0 ? `${stats.distance} km` : 'No data'}</Text>
                            </View>
                        </CustomCard>
                    </TouchableOpacity>
                </View>

                {/* Grid Section: Sessions & Awards */}
                <View style={tw`flex-row justify-between mb-4`}>
                    {/* Sessions */}
                    <CustomCard style={tw`flex-1 mr-2 h-40`}>
                        <View style={tw`flex-row justify-between items-start mb-2`}>
                            <Text style={[tw`font-semibold text-base`, { color: colors.text }]}>Sessions</Text>
                        </View>
                        <View style={tw`flex-1 items-center justify-center opacity-50`}>
                            <Ionicons name="walk-outline" size={32} color={colors.textSecondary} />
                            <Text style={[tw`text-xs text-center mt-2`, { color: colors.textSecondary }]}>Sessions coming soon</Text>
                        </View>
                    </CustomCard>

                    {/* Awards */}
                    <CustomCard style={tw`flex-1 ml-2 h-40`}>
                        <View style={tw`flex-row justify-between items-start mb-2`}>
                            <Text style={[tw`font-semibold text-base`, { color: colors.text }]}>Awards</Text>
                        </View>
                        <View style={tw`flex-1 items-center justify-center`}>
                            <View style={[tw`w-16 h-16 rounded-full border-2 items-center justify-center`, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                <Ionicons name="ribbon" size={32} color={colors.textSecondary} />
                            </View>
                        </View>
                        <Text style={[tw`text-xs text-center font-medium`, { color: colors.text }]}>Keep moving to earn awards</Text>
                    </CustomCard>
                </View>

                {/* Trends Section */}
                <View style={tw`mt-4`}>
                    <View style={tw`flex-row justify-between items-center mb-3 px-1`}>
                        <Text style={[tw`text-xl font-bold`, { color: colors.text }]}>Trends</Text>
                        <TouchableOpacity>
                            <Text style={[tw`text-sm font-semibold`, { color: colors.primary }]}>Show All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={tw`pr-4`}
                        decelerationRate="fast"
                        snapToInterval={176} // w-40 (160) + mr-4 (16)
                    >
                        {/* Trend Card 1: Move */}
                        <CustomCard style={tw`w-40 mr-4 p-4 justify-between h-36`}>
                            <View style={tw`flex-row justify-between items-start`}>
                                <View style={[tw`p-2 rounded-full`, { backgroundColor: 'rgba(250, 17, 79, 0.1)' }]}>
                                    <Ionicons name="flame" size={20} color={colors.activityRing} />
                                </View>
                                {/* Trend Indicator */}
                                <View style={tw`flex-row items-center`}>
                                    <Ionicons name="arrow-up" size={12} color={colors.activityRing} />
                                    <Text style={[tw`text-xs font-bold ml-0.5`, { color: colors.activityRing }]}>12%</Text>
                                </View>
                            </View>

                            <View>
                                <Text style={[tw`font-medium text-sm mb-1`, { color: colors.textSecondary }]}>Move</Text>
                                <View style={tw`flex-row items-baseline`}>
                                    <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>{stats.calories}</Text>
                                    <Text style={[tw`text-xs ml-1 font-semibold`, { color: colors.textSecondary }]}>KCAL</Text>
                                </View>
                            </View>
                        </CustomCard>

                        {/* Trend Card 2: Steps */}
                        <CustomCard style={tw`w-40 mr-4 p-4 justify-between h-36`}>
                            <View style={tw`flex-row justify-between items-start`}>
                                <View style={[tw`p-2 rounded-full`, { backgroundColor: 'rgba(8, 145, 178, 0.1)' }]}>
                                    <Ionicons name="footsteps" size={20} color={colors.steps} />
                                </View>
                                <View style={tw`flex-row items-center`}>
                                    <Ionicons name="arrow-up" size={12} color={colors.steps} />
                                    <Text style={[tw`text-xs font-bold ml-0.5`, { color: colors.steps }]}>5%</Text>
                                </View>
                            </View>

                            <View>
                                <Text style={[tw`font-medium text-sm mb-1`, { color: colors.textSecondary }]}>Steps</Text>
                                <View style={tw`flex-row items-baseline`}>
                                    <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>{stats.steps > 1000 ? (stats.steps / 1000).toFixed(1) + 'k' : stats.steps}</Text>
                                    <Text style={[tw`text-xs ml-1 font-semibold`, { color: colors.textSecondary }]}>steps</Text>
                                </View>
                            </View>
                        </CustomCard>

                        {/* Trend Card 3: Distance */}
                        <CustomCard style={tw`w-40 mr-4 p-4 justify-between h-36`}>
                            <View style={tw`flex-row justify-between items-start`}>
                                <View style={[tw`p-2 rounded-full`, { backgroundColor: 'rgba(168, 219, 16, 0.1)' }]}>
                                    <Ionicons name="map" size={20} color={colors.distance} />
                                </View>
                                <View style={tw`flex-row items-center`}>
                                    <Ionicons name="arrow-forward" size={12} color={colors.textSecondary} />
                                    <Text style={[tw`text-xs font-bold ml-0.5`, { color: colors.textSecondary }]}>--</Text>
                                </View>
                            </View>

                            <View>
                                <Text style={[tw`font-medium text-sm mb-1`, { color: colors.textSecondary }]}>Distance</Text>
                                <View style={tw`flex-row items-baseline`}>
                                    <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>{stats.distance}</Text>
                                    <Text style={[tw`text-xs ml-1 font-semibold`, { color: colors.textSecondary }]}>KM</Text>
                                </View>
                            </View>
                        </CustomCard>
                    </ScrollView>
                </View>

            </ScrollView>
        </View>
    );
}