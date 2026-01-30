import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function TabsLayout() {
  const { isDark, colors } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: colors.tabBar,
          borderRadius: 35,
          height: 70,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.tabBarBorder,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          paddingBottom: 5,
          paddingHorizontal: 10,
          alignItems: 'center',
          justifyContent: 'space-around',
        },
        tabBarItemStyle: {
          padding: 5,
        },
        tabBarLabelStyle: {
          marginBottom: 5,
          fontWeight: '600'
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size, focused }) => {
          const iconMap: Record<string, any> = {
            home: focused ? 'home' : 'home-outline',
            chat: focused ? 'chatbubbles' : 'chatbubbles-outline',
            profile: focused ? 'person' : 'person-outline',
          };
          const name = iconMap[route.name] ?? 'ellipse';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}