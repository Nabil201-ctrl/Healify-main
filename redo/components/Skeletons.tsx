import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ width, height, style, borderRadius = 8 }: { width: number | string, height: number, style?: any, borderRadius?: number }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const backgroundColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 : gray-200

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor,
                    opacity,
                    borderRadius,
                },
                style,
            ]}
        />
    );
};

export const DashboardSkeleton = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const bg = isDark ? '#000' : '#fff'; // Assuming default background

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            {/* Header Skeleton */}
            <View style={styles.header}>
                <View>
                    <SkeletonItem width={120} height={20} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={180} height={28} />
                </View>
                <SkeletonItem width={40} height={40} borderRadius={20} />
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <SkeletonItem width={100} height={24} />
                <SkeletonItem width={80} height={16} />
            </View>

            {/* Metrics Grid */}
            <View style={styles.grid}>
                <SkeletonItem width={(width - 56) / 2} height={160} style={{ marginBottom: 16 }} borderRadius={24} />
                <SkeletonItem width={(width - 56) / 2} height={160} style={{ marginBottom: 16 }} borderRadius={24} />
                <SkeletonItem width={(width - 56) / 2} height={160} style={{ marginBottom: 16 }} borderRadius={24} />
                <SkeletonItem width={(width - 56) / 2} height={160} style={{ marginBottom: 16 }} borderRadius={24} />
            </View>

            {/* Quick Stats */}
            <SkeletonItem width={width - 40} height={150} style={{ marginVertical: 16 }} borderRadius={24} />
        </View>
    );
};

export const ProfileSkeleton = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const bg = isDark ? '#000' : '#fff';

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={[styles.header, { justifyContent: 'center', alignItems: 'center', paddingTop: 60 }]}>
                <SkeletonItem width={100} height={24} />
            </View>

            {/* Avatar Section */}
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
                <SkeletonItem width={96} height={96} borderRadius={48} style={{ marginBottom: 16 }} />
                <SkeletonItem width={150} height={28} style={{ marginBottom: 8 }} />
                <SkeletonItem width={200} height={16} />
            </View>

            {/* Health Stats */}
            <View style={{ paddingHorizontal: 20 }}>
                <SkeletonItem width={120} height={24} style={{ marginBottom: 12 }} />
                <View style={styles.grid}>
                    <SkeletonItem width={(width - 52) / 2} height={100} style={{ marginBottom: 12 }} borderRadius={16} />
                    <SkeletonItem width={(width - 52) / 2} height={100} style={{ marginBottom: 12 }} borderRadius={16} />
                    <SkeletonItem width={(width - 52) / 2} height={100} style={{ marginBottom: 12 }} borderRadius={16} />
                    <SkeletonItem width={(width - 52) / 2} height={100} style={{ marginBottom: 12 }} borderRadius={16} />
                </View>
            </View>

            {/* Lifestyle */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                <SkeletonItem width={120} height={24} style={{ marginBottom: 12 }} />
                <SkeletonItem width={width - 40} height={180} borderRadius={16} />
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
});
