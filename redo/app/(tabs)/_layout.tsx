import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';

// ─── Notification badge dot ───────────────────────────────────────────────────
function NotifIcon({ color, focused, unread }: { color: string; focused: boolean; unread: number }) {
  return (
    <View>
      <Ionicons
        name={focused ? 'notifications' : 'notifications-outline'}
        size={24}
        color={color}
      />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count every 30 seconds
  useEffect(() => {
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/users/notifications');
        if (!cancelled) {
          setUnreadCount(res.data?.unreadCount ?? 0);
        }
      } catch {
        // silently ignore — user may not be authenticated yet
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          borderTopWidth: 0,
          borderWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={isDark ? ['#1f2937', '#000000'] : ['#ffffff', '#f3f4f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#e5e7eb',
              borderBottomWidth: 0,
            }}
          />
        ),
        tabBarItemStyle: { height: 50 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'BricolageGrotesque',
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <NotifIcon color={color} focused={focused} unread={unreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 11,
  },
});
