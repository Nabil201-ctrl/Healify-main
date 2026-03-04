import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getIncomingPatientChats } from '../../services/DoctorAuthService';

// ─── Notification Badge ───────────────────────────────────────────────────────
function Badge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <View style={{
            position: 'absolute', top: -4, right: -8,
            backgroundColor: '#ef4444', borderRadius: 8,
            minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 3, borderWidth: 1.5, borderColor: 'white',
        }}>
            <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold', lineHeight: 11 }}>
                {count > 9 ? '9+' : count}
            </Text>
        </View>
    );
}

// ─── Live Chat Tab Icon ───────────────────────────────────────────────────────
function LiveChatIcon({ color }: { color: string }) {
    const { data: chats = [] } = useQuery({
        queryKey: ['live-chats'],
        queryFn: getIncomingPatientChats,
        refetchInterval: 10000,
    });
    const waiting = (chats as any[]).filter((c: any) => c.status === 'waiting').length;

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
            <Ionicons name="chatbubbles" size={26} color={color} />
            <Badge count={waiting} />
        </View>
    );
}

// ─── Tab Layout ───────────────────────────────────────────────────────────────
export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarShowLabel: false,
            tabBarStyle: {
                height: 60,
                backgroundColor: '#ffffff',
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            headerShown: false,
        }}>
            <Tabs.Screen
                name="review-queue"
                options={{
                    title: 'Review Queue',
                    tabBarIcon: ({ color }) => <Ionicons name="clipboard" size={26} color={color} style={{ marginTop: 8 }} />,
                }}
            />
            <Tabs.Screen
                name="live-chats"
                options={{
                    title: 'Live Chats',
                    tabBarIcon: ({ color }) => <LiveChatIcon color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={26} color={color} style={{ marginTop: 8 }} />,
                }}
            />
        </Tabs>
    );
}
