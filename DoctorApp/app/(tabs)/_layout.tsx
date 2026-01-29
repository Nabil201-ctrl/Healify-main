import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#2563eb',
            tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60 },
            headerShown: false
        }}>
            <Tabs.Screen
                name="review-queue"
                options={{
                    title: 'Review Queue',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📋</Text>,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👨‍⚕️</Text>,
                }}
            />
        </Tabs>
    );
}
