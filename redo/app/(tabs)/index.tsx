import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth.service';
import { DashboardHeader } from '@/components/DashboardHeader';
import HealthMetricCard from '@/components/HealthMetricCard';
import { HeartRateChart } from '@/components/HeartRateChart';
import { SleepChart } from '@/components/SleepChart';
import ActivityChart from '@/components/ActivityChart';

// Simplistic user type for now
interface User {
  id: string;
  firstName: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<User | null>({ id: '123', firstName: 'User' }); // Mock default
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    // try {
    //   const userData = await AuthService.getUser();
    //   if (userData) setUser(userData);
    // } catch (e) {
    //   console.log("Failed to load user");
    // }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refetching data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          userName={user?.firstName || 'User'}
          lastSyncTime="2 min ago"
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Today's Overview
        </Text>

        <View style={styles.metricsGrid}>
          <HealthMetricCard
            title="Calories"
            value="2,456"
            unit="kcal burned"
            icon="🔥"
            gradientColors={isDark ? ['#7f1d1d', '#991b1b'] : ['#ef4444', '#dc2626']}
            trend="up"
            trendValue="12%"
          />
          <HealthMetricCard
            title="Steps"
            value="8,547"
            unit="steps today"
            icon="👟"
            gradientColors={isDark ? ['#1e3a8a', '#1e40af'] : ['#3b82f6', '#2563eb']}
            trend="down"
            trendValue="5%"
          />
          <HealthMetricCard
            title="Heart Rate"
            value="72"
            unit="bpm average"
            icon="❤️"
            gradientColors={isDark ? ['#831843', '#9d174d'] : ['#ec4899', '#db2777']}
            trend="stable"
            trendValue="0%"
          />
          <HealthMetricCard
            title="Active Time"
            value="2.5"
            unit="hours active"
            icon="⚡"
            gradientColors={isDark ? ['#78350f', '#92400e'] : ['#f59e0b', '#d97706']}
            trend="up"
            trendValue="18%"
          />
        </View>

        <HeartRateChart />
        <ActivityChart />
        <SleepChart />

        {/* More Metrics Section */}
        <View style={[styles.moreMetricsContainer, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>More Metrics</Text>

          <View style={styles.moreMetricsRow}>
            <MetricBox label="Distance" value="6.8 km" color="cyan" isDark={isDark} />
            <MetricBox label="Floors" value="12" color="teal" isDark={isDark} />
          </View>
          <View style={styles.moreMetricsRow}>
            <MetricBox label="Stress Level" value="Low" color="orange" isDark={isDark} />
            <MetricBox label="Body Battery" value="78%" color="violet" isDark={isDark} />
          </View>
        </View>

        {/* Insights Section */}
        {/* Simplified gradient background not using LinearGradient here to save import, or could use View style */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>💡 Today's Insights</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Great Activity!</Text>
            <Text style={styles.insightText}>You're 15% more active than last Monday. Keep it up!</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Hydration Reminder</Text>
            <Text style={styles.insightText}>Don't forget to drink water. Target: 2L/day</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const MetricBox = ({ label, value, color, isDark }: { label: string, value: string, color: string, isDark: boolean }) => {
  // Simple color mapping
  const getBgColor = () => {
    if (color === 'cyan') return isDark ? '#164e63' : '#ecfeff'; // cyan-900 / cyan-50
    if (color === 'teal') return isDark ? '#134e4a' : '#f0fdfa';
    if (color === 'orange') return isDark ? '#7c2d12' : '#fff7ed';
    return isDark ? '#4c1d95' : '#f5f3ff'; // violet
  };

  const getTextColor = () => {
    if (color === 'cyan') return isDark ? '#a5f3fc' : '#0e7490';
    if (color === 'teal') return isDark ? '#99f6e4' : '#0f766e';
    if (color === 'orange') return isDark ? '#fdba74' : '#c2410c';
    return isDark ? '#ddd6fe' : '#7c3aed';
  };

  return (
    <View style={[styles.metricBox, { backgroundColor: getBgColor() }]}>
      <Text style={[styles.metricLabel, { color: getTextColor() }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: getTextColor() }]}>{value}</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
    fontFamily: 'BricolageGrotesque',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moreMetricsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightsContainer: {
    backgroundColor: '#6366f1', // Indogo-500 fallback
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  insightsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'BricolageGrotesque',
  },
  insightItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  insightLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
});
