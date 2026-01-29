import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/api';
import tw from 'twrnc';

export default function SettingsScreen() {
  const { isDark, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [healthStatus, setHealthStatus] = useState<string>('');

  const pingBackend = async () => {
    try {
      const res = await api.get('/health');
      setHealthStatus(`OK: ${res.data?.timestamp ?? ''}`);
    } catch (e: any) {
      setHealthStatus(`Error: ${e?.message ?? 'unknown error'}`);
    }
  };

  const Card = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <View style={[tw`rounded-2xl p-4 mb-4`, { backgroundColor: colors.card }, style]}>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[tw`flex-1`, { backgroundColor: colors.background }]}
      contentContainerStyle={tw`pb-32`}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={tw`p-4 pt-12`}>
        <Text style={[tw`text-3xl font-bold mb-6`, { color: colors.text }]}>Settings</Text>

        {/* Appearance Section */}
        <Card>
          <Text style={[tw`text-lg font-semibold mb-4`, { color: colors.text }]}>Appearance</Text>

          <View style={tw`flex-row items-center justify-between py-3`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-2xl mr-3`}>{isDark ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={[tw`text-base font-medium`, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[tw`text-sm`, { color: colors.textSecondary }]}>
                  {isDark ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={isDark ? '#fff' : '#f3f4f6'}
            />
          </View>
        </Card>

        {/* Notifications Section */}
        <Card>
          <Text style={[tw`text-lg font-semibold mb-4`, { color: colors.text }]}>Notifications</Text>

          <View style={tw`flex-row items-center justify-between py-3`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-2xl mr-3`}>🔔</Text>
              <View>
                <Text style={[tw`text-base font-medium`, { color: colors.text }]}>Enable Notifications</Text>
                <Text style={[tw`text-sm`, { color: colors.textSecondary }]}>
                  Get health reminders and updates
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={notifications ? '#fff' : '#f3f4f6'}
            />
          </View>
        </Card>

        {/* Backend Health Check */}
        <Card>
          <Text style={[tw`text-lg font-semibold mb-4`, { color: colors.text }]}>System Status</Text>

          <TouchableOpacity
            onPress={pingBackend}
            style={tw`bg-green-600 py-3 rounded-xl items-center mb-3`}
          >
            <Text style={tw`text-white font-semibold text-base`}>🏥 Check Backend Health</Text>
          </TouchableOpacity>

          {healthStatus ? (
            <View style={[tw`p-3 rounded-xl`, { backgroundColor: healthStatus.startsWith('OK') ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#7f1d1d' : '#fef2f2') }]}>
              <Text style={[tw`font-medium`, { color: healthStatus.startsWith('OK') ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c') }]}>
                {healthStatus}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* About Section */}
        <Card>
          <Text style={[tw`text-lg font-semibold mb-4`, { color: colors.text }]}>About</Text>

          <View style={tw`py-2`}>
            <Text style={[tw`text-sm mb-1`, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[tw`text-base font-medium`, { color: colors.text }]}>1.0.0</Text>
          </View>

          <View style={[tw`py-2 border-t mt-2`, { borderColor: colors.border }]}>
            <Text style={[tw`text-sm mb-1`, { color: colors.textSecondary }]}>App</Text>
            <Text style={[tw`text-base font-medium`, { color: colors.text }]}>Healify</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}