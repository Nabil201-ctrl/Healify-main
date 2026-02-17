import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DashboardHeader } from '@/components/DashboardHeader';
import HealthMetricCard from '@/components/HealthMetricCard';
import { HeartRateChart } from '@/components/HeartRateChart';
import { SleepChart } from '@/components/SleepChart';
import ActivityChart from '@/components/ActivityChart';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  firstName: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<User | null>({ id: '123', firstName: 'Nabil' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // loadUser();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
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
          lastSyncTime="Just now"
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
          {/* 
            Refactored Cards:
            - Removed gradientColors prop
            - Added accentColor prop
          */}
          <HealthMetricCard
            title="Calories"
            value="2,456"
            unit="kcal"
            icon="🔥"
            accentColor={colors.error} // Red accent
            trend="up"
            trendValue="12%"
          />
          <HealthMetricCard
            title="Steps"
            value="8,547"
            unit="steps"
            icon="👟"
            accentColor={colors.primary} // Indigo accent
            trend="down"
            trendValue="5%"
          />
          <HealthMetricCard
            title="Heart Rate"
            value="72"
            unit="bpm"
            icon="❤️"
            accentColor={colors.secondary} // Violet accent
            trend="stable"
            trendValue="0%"
          />
          <HealthMetricCard
            title="Active Time"
            value="2.5"
            unit="hrs"
            icon="⚡"
            accentColor={colors.warning} // Amber accent
            trend="up"
            trendValue="18%"
          />
        </View>

        <HeartRateChart />
        <ActivityChart />
        <SleepChart />

        {/* More Metrics Section - Cleaned up */}
        <View style={[styles.moreMetricsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Stats</Text>

          <View style={styles.moreMetricsRow}>
            <MetricBox label="Distance" value="6.8 km" icon="map-outline" color={colors.primary} isDark={isDark} />
            <MetricBox label="Floors" value="12" icon="layers-outline" color={colors.secondary} isDark={isDark} />
          </View>
          <View style={styles.moreMetricsRow}>
            <MetricBox label="Stress" value="Low" icon="pulse-outline" color={colors.success} isDark={isDark} />
            <MetricBox label="Recovery" value="78%" icon="battery-charging-outline" color={colors.tint} isDark={isDark} />
          </View>
        </View>

        {/* Insights Section - Unified */}
        <View style={[styles.insightsContainer, { backgroundColor: isDark ? '#1e1b4b' : '#e0e7ff' }]}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb" size={20} color={isDark ? '#818cf8' : '#4f46e5'} />
            <Text style={[styles.insightsTitle, { color: isDark ? '#e0e7ff' : '#312e81' }]}>Today's Insights</Text>
          </View>

          <View style={[styles.insightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }]}>
            <Text style={[styles.insightLabel, { color: isDark ? '#c7d2fe' : '#4338ca' }]}>Trending Up</Text>
            <Text style={[styles.insightText, { color: isDark ? '#e0e7ff' : '#3730a3' }]}>You're 15% more active than last Monday. Great momentum!</Text>
          </View>

          <View style={[styles.insightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }]}>
            <Text style={[styles.insightLabel, { color: isDark ? '#c7d2fe' : '#4338ca' }]}>Goal Check</Text>
            <Text style={[styles.insightText, { color: isDark ? '#e0e7ff' : '#3730a3' }]}>You need 1,453 more steps to hit your daily target.</Text>
          </View>
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
