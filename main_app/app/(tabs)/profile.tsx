import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar, Switch } from 'react-native';
import api from '../../api/api';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

export default function ProfileScreen() {
    const { user, signOut } = useAuthContext();
    const { colors, isDark, toggleTheme } = useTheme();
    const router = useRouter();
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

    const InfoCard = ({ icon, label, value, color = colors.primary }: { icon: any, label: string, value: string | number, color?: string }) => (
        <View style={[tw`flex-1 p-4 rounded-2xl mb-3 mr-2 ml-2`, { backgroundColor: colors.card, minWidth: '40%' }]}>
            <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name={icon} size={20} color={color} style={tw`mr-2`} />
                <Text style={[tw`text-xs font-semibold`, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>{value || '-'}</Text>
        </View>
    );

    return (
        <View style={[tw`flex-1`, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={tw`pt-12 pb-4 px-4 flex-row items-center justify-between`}>
                <View style={[tw`w-10 h-10`]} /> {/* Spacer */}
                <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>Profile</Text>
                <TouchableOpacity onPress={signOut} style={[tw`p-2 rounded-full`, { backgroundColor: `${colors.activityRing}20` }]}>
                    <Ionicons name="log-out-outline" size={24} color={colors.activityRing} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
                {/* Profile Header */}
                <View style={tw`items-center my-6`}>
                    <View style={[tw`w-24 h-24 rounded-full border-4 items-center justify-center mb-4`, { borderColor: colors.card, backgroundColor: colors.border }]}>
                        <Text style={[tw`text-3xl font-bold`, { color: colors.textSecondary }]}>
                            {user?.firstName ? user.firstName[0] : 'U'}
                        </Text>
                    </View>
                    <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <Text style={[tw`text-sm font-medium mt-1`, { color: colors.textSecondary }]}>
                        {user?.email}
                    </Text>

                    {user?.location && (
                        <View style={tw`flex-row items-center mt-2`}>
                            <Ionicons name="location-sharp" size={14} color={colors.primary} />
                            <Text style={[tw`text-xs ml-1`, { color: colors.textSecondary }]}>{user.location}</Text>
                        </View>
                    )}
                </View>

                {/* Health Stats Grid */}
                <Text style={[tw`text-lg font-bold mb-4 ml-2`, { color: colors.text }]}>Health Profile</Text>

                <View style={tw`flex-row flex-wrap justify-between -mx-2`}>
                    <InfoCard
                        icon="calendar"
                        label="Age"
                        value={`${user?.age} yrs`}
                        color={colors.steps}
                    />
                    <InfoCard
                        icon="body"
                        label="Body Type"
                        value={user?.bodyType}
                        color={colors.activityRing}
                    />
                    <InfoCard
                        icon="resize"
                        label="Height"
                        value={`${user?.height} cm`}
                        color={colors.distance}
                    />
                    <InfoCard
                        icon="scale"
                        label="Weight"
                        value={`${user?.weight} kg`}
                        color={colors.primary}
                    />
                </View>

                {/* Activity & Employment */}
                <Text style={[tw`text-lg font-bold mb-4 mt-2 ml-2`, { color: colors.text }]}>Lifestyle</Text>
                <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: colors.card }]}>
                    <View style={tw`flex-row items-center mb-4 border-b pb-4 border-gray-100 dark:border-gray-800`}>
                        <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: `${colors.primary}20` }]}>
                            <Ionicons name="walk" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>Activity Level</Text>
                            <Text style={[tw`text-base font-bold`, { color: colors.text }]}>{user?.activityLevel}</Text>
                        </View>
                    </View>

                    <View style={tw`flex-row items-center mb-4 border-b pb-4 border-gray-100 dark:border-gray-800`}>
                        <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: `${colors.steps}20` }]}>
                            <Ionicons name="briefcase" size={20} color={colors.steps} />
                        </View>
                        <View>
                            <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>Job Type</Text>
                            <Text style={[tw`text-base font-bold`, { color: colors.text }]}>{user?.jobType}</Text>
                        </View>
                    </View>

                    <View style={tw`flex-row items-center`}>
                        <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: `${colors.distance}20` }]}>
                            <Ionicons name="footsteps" size={20} color={colors.distance} />
                        </View>
                        <View>
                            <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>Daily Step Goal</Text>
                            <Text style={[tw`text-base font-bold`, { color: colors.text }]}>{user?.averageSteps || 8000}</Text>
                        </View>
                    </View>
                </View>

                {/* Account Info */}
                <View style={[tw`p-4 rounded-2xl mt-2 mb-4`, { backgroundColor: colors.card }]}>
                    <View style={tw`flex-row justify-between items-center`}>
                        <Text style={[tw`text-sm font-medium`, { color: colors.text }]}>Member Since</Text>
                        <Text style={[tw`text-sm`, { color: colors.textSecondary }]}>Dec 2024</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <Text style={[tw`text-lg font-bold mb-4 mt-6 ml-2`, { color: colors.text }]}>Settings</Text>

                {/* Appearance */}
                <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: colors.card }]}>
                    <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={[tw`w-8 h-8 rounded-full items-center justify-center mr-3`, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <Text style={tw`text-lg`}>{isDark ? '🌙' : '☀️'}</Text>
                            </View>
                            <Text style={[tw`text-base font-medium`, { color: colors.text }]}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#d1d5db', true: '#10b981' }}
                            thumbColor={isDark ? '#fff' : '#f3f4f6'}
                        />
                    </View>
                </View>

                {/* Notifications */}
                <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: colors.card }]}>
                    <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={[tw`w-8 h-8 rounded-full items-center justify-center mr-3`, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <Text style={tw`text-lg`}>🔔</Text>
                            </View>
                            <Text style={[tw`text-base font-medium`, { color: colors.text }]}>Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#d1d5db', true: '#10b981' }}
                            thumbColor={notifications ? '#fff' : '#f3f4f6'}
                        />
                    </View>
                </View>

                {/* System Status */}
                <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: colors.card }]}>
                    <Text style={[tw`font-semibold mb-3`, { color: colors.text }]}>System Status</Text>
                    <TouchableOpacity
                        onPress={pingBackend}
                        style={tw`bg-green-600 py-3 rounded-xl items-center mb-3`}
                    >
                        <Text style={tw`text-white font-semibold`}>🏥 Check Backend Health</Text>
                    </TouchableOpacity>

                    {healthStatus ? (
                        <View style={[tw`p-3 rounded-xl`, { backgroundColor: healthStatus.startsWith('OK') ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#7f1d1d' : '#fef2f2') }]}>
                            <Text style={[tw`font-medium text-xs`, { color: healthStatus.startsWith('OK') ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c') }]}>
                                {healthStatus}
                            </Text>
                        </View>
                    ) : null}
                </View>

            </ScrollView>
        </View>
    );
}
