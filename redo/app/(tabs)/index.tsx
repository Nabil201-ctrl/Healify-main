import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DashboardHeader } from '@/components/DashboardHeader';
import HealthMetricCard from '@/components/HealthMetricCard';
import { HeartRateChart } from '@/components/HeartRateChart';
import { SleepChart } from '@/components/SleepChart';
import ActivityChart from '@/components/ActivityChart';
import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { UserService, UserProfile } from '@/services/UserService';
import { HealthService, ActivityData, HeartRateData, SleepData, QuickStatsData, InsightData } from '@/services/HealthService';
import { useFocusEffect } from 'expo-router';
import { DashboardSkeleton } from '@/components/Skeletons';

// Module-level cache to persist data across component unmounts (e.g., tab switches)
let lastFetchTime: number | null = null;
let cachedUser: UserProfile | null = null;
let cachedActivity: ActivityData | null = null;
let cachedHeartRate: HeartRateData | null = null;
let cachedSleep: SleepData | null = null;
let cachedQuickStats: QuickStatsData | null = null;
let cachedInsights: InsightData[] = [];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [heartRate, setHeartRate] = useState<HeartRateData | null>(null);
  const [sleep, setSleep] = useState<SleepData | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStatsData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Global cache tracker outside React state to persist across unmounts/remounts within the same session
  // Could also use a React ref or separate context, but module-level variable is simplest for preventing rapid tab-switch requests.
  const loadData = async (forceRefresh = false) => {
    // Cache for 5 minutes (300,000 ms)
    const CACHE_TTL = 300000;

    // Check if we can use existing data (must have user data, and fetch is recent)
    if (!forceRefresh && lastFetchTime && Date.now() - lastFetchTime < CACHE_TTL && cachedUser) {
      setUser(cachedUser);
      if (cachedActivity) setActivity(cachedActivity);
      if (cachedHeartRate) setHeartRate(cachedHeartRate);
      if (cachedSleep) setSleep(cachedSleep);
      if (cachedQuickStats) setQuickStats(cachedQuickStats);
      if (cachedInsights) setInsights(cachedInsights);
      return;
    }

    try {
      const [userData, activityData, heartRateData, sleepData, quickStatsData, insightsData] = await Promise.all([
        UserService.getProfile(),
        HealthService.getActivity().catch(e => null),
        HealthService.getHeartRate().catch(e => null),
        HealthService.getSleep().catch(e => null),
        HealthService.getQuickStats().catch(e => null),
        HealthService.getInsights().catch(e => [])
      ]);

      cachedUser = userData;
      cachedActivity = activityData;
      cachedHeartRate = heartRateData;
      cachedSleep = sleepData;
      cachedQuickStats = quickStatsData;
      cachedInsights = insightsData;
      lastFetchTime = Date.now();

      setUser(userData);
      if (activityData) setActivity(activityData);
      if (heartRateData) setHeartRate(heartRateData);
      if (sleepData) setSleep(sleepData);
      if (quickStatsData) setQuickStats(quickStatsData);
      if (insightsData) setInsights(insightsData);
    } catch (error) {
      console.log('Failed to load data', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, []);

  if (!user && !refreshing) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          userName={user?.firstName || 'User'}
          lastSyncTime="Just now"
          onNotificationPress={() => router.push('/notifications')}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Overview
          </Text>
          <TouchableOpacity>
            <Text style={{ color: colors.tint, fontFamily: 'BricolageGrotesque', fontSize: 14 }}>See Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          <HealthMetricCard
            title="Steps"
            value={activity?.summary.dailyAvg ? activity.summary.dailyAvg.toLocaleString() : '--'}
            unit="steps"
            icon="footsteps"
            accentColor={colors.tint}
            trend="stable"
            trendValue=""
            onPress={() => router.push('/metrics/steps')}
          />
          <HealthMetricCard
            title="Calories"
            value={activity?.summary.dailyAvg ? Math.round(activity.summary.dailyAvg * 0.04).toLocaleString() : '--'}
            unit="kcal"
            icon="flame"
            accentColor={colors.tint}
            trend="stable"
            trendValue=""
            onPress={() => router.push('/metrics/calories')}
          />
          <HealthMetricCard
            title="Heart Rate"
            value={heartRate?.stats.avg ? String(heartRate.stats.avg) : '--'}
            unit="bpm"
            icon="heart"
            accentColor={colors.tint}
            trend="stable"
            trendValue=""
            onPress={() => router.push('/metrics/heart-rate')}
          />
          <HealthMetricCard
            title="Active Time"
            value={quickStats?.activeTime ? quickStats.activeTime : '--'}
            unit="today"
            icon="flash"
            accentColor={colors.tint}
            trend="stable"
            trendValue=""
            onPress={() => router.push('/metrics/active-time')}
          />
          <HealthMetricCard
            title="Sleep"
            value={sleep?.lastNight.duration || '--'}
            unit="last night"
            icon="moon"
            accentColor={colors.secondary}
            trend="stable"
            trendValue={sleep?.lastNight.quality || ''}
            onPress={() => router.push('/metrics/sleep')}
          />
        </View>

        {/* Graphs moved to detailed pages */}

        {/* More Metrics Section - Cleaned up */}
        <View style={[styles.moreMetricsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Stats</Text>

          <View style={styles.moreMetricsRow}>
            <MetricBox label="Distance" value={quickStats?.distance || '--'} icon="map-outline" color={colors.primary} isDark={isDark} />
            <MetricBox label="Floors" value={quickStats?.floors || '--'} icon="layers-outline" color={colors.secondary} isDark={isDark} />
          </View>
          <View style={styles.moreMetricsRow}>
            <MetricBox label="Stress" value={quickStats?.stress || '--'} icon="pulse-outline" color={colors.success} isDark={isDark} />
            <MetricBox label="Recovery" value={quickStats?.recovery || '--'} icon="battery-charging-outline" color={colors.tint} isDark={isDark} />
          </View>
        </View>

        {/* Insights Section - Unified */}
        <View style={[styles.insightsContainer, { backgroundColor: isDark ? '#1e1b4b' : '#e0e7ff' }]}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb" size={20} color={isDark ? '#818cf8' : '#4f46e5'} />
            <Text style={[styles.insightsTitle, { color: isDark ? '#e0e7ff' : '#312e81' }]}>Today's Insights</Text>
          </View>

          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <View key={index} style={[styles.insightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }]}>
                <Text style={[styles.insightLabel, { color: isDark ? '#c7d2fe' : '#4338ca' }]}>{insight.label}</Text>
                <Text style={[styles.insightText, { color: isDark ? '#e0e7ff' : '#3730a3' }]}>{insight.text}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.insightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }]}>
              <Text style={[styles.insightLabel, { color: isDark ? '#c7d2fe' : '#4338ca' }]}>No Insights</Text>
              <Text style={[styles.insightText, { color: isDark ? '#e0e7ff' : '#3730a3' }]}>Check back later for health insights.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const MetricBox = ({ label, value, icon, color, isDark }: { label: string, value: string, icon: any, color: string, isDark: boolean }) => {
  return (
    <View style={[
      styles.metricBox,
      {
        backgroundColor: isDark ? `${color}15` : `${color}10`, // Very subtle tint
        borderColor: isDark ? `${color}30` : `${color}20`,
        borderWidth: 1,
      }
    ]}>
      <View style={{ marginBottom: 8 }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.metricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'BricolageGrotesque',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moreMetricsContainer: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'BricolageGrotesque',
  },
  moreMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'BricolageGrotesque',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BricolageGrotesque',
  },
  insightsContainer: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 100, // Space for tab bar
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BricolageGrotesque',
    marginLeft: 8,
  },
  insightItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'BricolageGrotesque',
    lineHeight: 20,
  },
});
