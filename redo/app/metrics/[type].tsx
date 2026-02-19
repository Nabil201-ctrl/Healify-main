
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HeartRateChart } from '@/components/HeartRateChart';
import { SleepChart } from '@/components/SleepChart';
import ActivityChart from '@/components/ActivityChart';

export default function MetricDetails() {
    const { type } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const { width } = useWindowDimensions();

    const getTitle = () => {
        switch (type) {
            case 'heart-rate': return 'Heart Rate';
            case 'activity': return 'Activity';
            case 'sleep': return 'Sleep';
            case 'steps': return 'Steps';
            case 'calories': return 'Calories';
            case 'active-time': return 'Active Time';
            default: return 'Metric Details';
        }
    };

    const renderChart = () => {
        switch (type) {
            case 'heart-rate':
                return <HeartRateChart />;
            case 'activity':
            case 'steps':
            case 'calories':
            case 'active-time':
                // ActivityChart covers these for now based on the previous file content
                return <ActivityChart />;
            case 'sleep':
                return <SleepChart />;
            default:
                return (
                    <View style={[styles.placeholderContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={{ color: colors.text }}>Chart not available for {type}</Text>
                    </View>
                );
        }
    };

    const renderDetails = () => {
        // dynamic details based on type
        return (
            <View style={[styles.detailsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailsTitle, { color: colors.text }]}>About this metric</Text>
                <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                    Here you can see detailed statistics and trends for your {getTitle().toLowerCase()}.
                    Analyze your progress over time and stay on top of your health goals.
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{getTitle()}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderChart()}
                {renderDetails()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60, // Adjust for status bar
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    content: {
        padding: 20,
    },
    placeholderContainer: {
        height: 200,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 24,
    },
    detailsContainer: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: 'BricolageGrotesque',
    },
    detailsText: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'BricolageGrotesque',
    }
});
