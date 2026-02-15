import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Animated,
    Dimensions,
    StyleSheet,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth.service';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Welcome to Healthify',
        description: 'Your complete personal health companion, simplified for your daily life.',
        icon: 'heart-o',
        color: '#3B82F6',
        gradient: ['#EFF6FF', '#DBEAFE']
    },
    {
        id: '2',
        title: 'Understand Your Health',
        description: 'Track symptoms and gain insights into what truly matters for your well-being.',
        icon: 'heartbeat',
        color: '#10B981',
        gradient: ['#ECFDF5', '#D1FAE5']
    },
    {
        id: '3',
        title: 'Track Your Vitals',
        description: 'Monitor your stats, sleep patterns, and daily activity in one unified dashboard.',
        icon: 'bar-chart',
        color: '#F59E0B',
        gradient: ['#FFFBEB', '#FEF3C7']
    },
    {
        id: '4',
        title: 'Smart Insights',
        description: 'Receive personalized health tips and preventive care reminders just for you.',
        icon: 'lightbulb-o',
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
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleProceed = async () => {
        // In a real app, you might update the user status on the server here.
        // For now, we'll just navigate to the tabs.
        router.replace('/(tabs)');
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
            <View style={[styles.slideContainer, { width }]}>
                <View style={[styles.iconContainer, { shadowColor: item.color }]}>
                    <FontAwesome name={item.icon as any} size={80} color={item.color} />
                </View>

                <Text style={styles.title}>
                    {item.title}
                </Text>

                <Text style={styles.description}>
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
        <View style={styles.dotsContainer}>
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
                            styles.dot,
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
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={slides[currentIndex].gradient as [string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleProceed}
                        style={styles.skipButton}
                    >
                        <Text style={styles.skipText}>Skip</Text>
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
                    style={styles.flatList}
                />

                <View style={styles.footer}>
                    <Dots />

                    <TouchableOpacity
                        onPress={handleNextSlide}
                        style={[
                            styles.nextButton,
                            {
                                backgroundColor: slides[currentIndex].color,
                                shadowColor: slides[currentIndex].color,
                            }
                        ]}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                        </Text>
                        <FontAwesome
                            name="arrow-right"
                            size={18}
                            color="white"
                            style={styles.nextButtonIcon}
                        />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 24,
    },
    skipButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    skipText: {
        color: '#475569',
        fontWeight: '600',
        fontSize: 14,
    },
    flatList: {
        flex: 1,
    },
    slideContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 180,
        height: 180,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 48,
        backgroundColor: 'white',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#1e293b',
    },
    description: {
        fontSize: 18,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: 16,
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: 48,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 6,
    },
    nextButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    nextButtonIcon: {
        position: 'absolute',
        right: 24,
    },
});
