import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Animated,
    Dimensions,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import api from '../../api/api';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Welcome to Healthify',
        description: 'Your complete personal health companion, simplified for your daily life.',
        icon: 'heart-circle',
        color: '#3B82F6',
        gradient: ['#EFF6FF', '#DBEAFE']
    },
    {
        id: '2',
        title: 'Understand Your Health',
        description: 'Track symptoms and gain insights into what truly matters for your well-being.',
        icon: 'pulse',
        color: '#10B981',
        gradient: ['#ECFDF5', '#D1FAE5']
    },
    {
        id: '3',
        title: 'Track Your Vitals',
        description: 'Monitor your stats, sleep patterns, and daily activity in one unified dashboard.',
        icon: 'stats-chart',
        color: '#F59E0B',
        gradient: ['#FFFBEB', '#FEF3C7']
    },
    {
        id: '4',
        title: 'Smart Insights',
        description: 'Receive personalized health tips and preventive care reminders just for you.',
        icon: 'bulb',
        color: '#8B5CF6',
        gradient: ['#F5F3FF', '#EDE9FE']
    },
    {
        id: '5',
        title: 'Ready to Begin?',
        description: 'Let’s get your profile set up so we can tailor the experience to your needs.',
        icon: 'rocket',
        color: '#EC4899',
        gradient: ['#FDF2F8', '#FCE7F3']
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { reloadUser } = useAuthContext();
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleProceed = async () => {
        try {
            // Request notification permissions
            const { registerForPushNotificationsAsync, getNotificationPermissionStatus } = await import('../../services/NotificationService');

            // Non-blocking permission request
            try {
                const currentStatus = await getNotificationPermissionStatus();
                if (currentStatus === 'undetermined') {
                    await registerForPushNotificationsAsync();
                }
            } catch (err) {
                console.log('[Onboarding] Notification permission skipped');
            }

            // Update backend status
            await api.patch('/users/me', { onboardingStatus: 'PROFILE_SETUP' });
            await reloadUser();

            // Redirection handled by RootLayout logic
        } catch (error) {
            console.error('[Onboarding] Failed to update status:', error);
            // Fallback navigation if needed
            router.replace('/(onboarding)/profile-setup');
        }
    };

    const handleNextSlide = () => {
        if (currentIndex < slides.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToOffset({
                offset: nextIndex * width,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        } else {
            handleProceed();
        }
    };

    const renderItem = ({ item }: { item: typeof slides[0] }) => {
        return (
            <View style={[tw`items-center justify-center p-8`, { width, height: height * 0.7 }]}>
                <View style={[
                    tw`w-48 h-48 rounded-[3rem] items-center justify-center mb-12 shadow-lg`,
                    { backgroundColor: 'white', shadowColor: item.color, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 }
                ]}
                >
                    <Ionicons name={item.icon as any} size={96} color={item.color} />
                </View>

                <Text style={tw`text-3xl font-bold text-center mb-4 text-slate-800`}>
                    {item.title}
                </Text>

                <Text style={tw`text-lg text-slate-500 text-center px-4 leading-8`}>
                    {item.description}
                </Text>
            </View>
        );
    };

    const updateCurrentIndex = (e: any) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        setCurrentIndex(index);
    };

    const Dots = () => (
        <View style={tw`flex-row justify-center mb-8`}>
            {slides.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 30, 10],
                    extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={i}
                        style={[
                            tw`h-2.5 rounded-full mx-1.5`,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: slides[currentIndex].color,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar barStyle="dark-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={slides[currentIndex].gradient}
                style={tw`absolute inset-0`}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={tw`flex-1`}>
                <View style={tw`flex-row justify-end p-6`}>
                    <TouchableOpacity
                        onPress={handleProceed}
                        style={tw`px-5 py-2.5 bg-white/60 rounded-full border border-white/20`}
                    >
                        <Text style={tw`text-slate-600 font-semibold tracking-wide`}>Skip</Text>
                    </TouchableOpacity>
                </View>

                <Animated.FlatList
                    data={slides}
                    ref={flatListRef}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                    onMomentumScrollEnd={updateCurrentIndex}
                    scrollEventThrottle={16}
                    style={tw`flex-1`}
                />

                <View style={tw`px-8 pb-12`}>
                    <Dots />

                    <TouchableOpacity
                        onPress={handleNextSlide}
                        style={[
                            tw`w-full py-4 rounded-2xl shadow-lg flex-row items-center justify-center relative overflow-hidden`,
                            {
                                backgroundColor: slides[currentIndex].color,
                                shadowColor: slides[currentIndex].color,
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.3,
                                shadowRadius: 20,
                                elevation: 10
                            }
                        ]}
                        activeOpacity={0.9}
                    >
                        <Text style={tw`text-white text-lg font-bold tracking-wide`}>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                        </Text>
                        <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="white"
                            style={tw`absolute right-6`}
                        />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
