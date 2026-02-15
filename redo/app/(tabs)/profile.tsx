import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Switch, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { AuthService } from '@/services/auth.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    location?: string;
    age: number;
    bodyType: string;
    height: number;
    weight: number;
    activityLevel: string;
    jobType: string;
    averageSteps: number;
}

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const [user, setUser] = useState<UserProfile>({
        firstName: 'Nabil',
        lastName: 'Abubakar',
        email: 'nabil@example.com',
        location: 'Lagos, Nigeria',
        age: 25,
        bodyType: 'Athletic',
        height: 180,
        weight: 75,
        activityLevel: 'Active',
        jobType: 'Software Engineer',
        averageSteps: 10000,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<UserProfile>(user);

    // UI State
    const [notifications, setNotifications] = useState(true);
    const [healthStatus, setHealthStatus] = useState<string>('');
    const [darkModeSwitch, setDarkModeSwitch] = useState(isDark);

    useEffect(() => {
        setDarkModeSwitch(isDark);
    }, [isDark]);

    const handleSignOut = async () => {
        try {
            await AuthService.logout();
            router.replace('/(auth)/login');
        } catch (error) {
            Alert.alert("Error", "Failed to sign out");
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Save changes
            setUser(editedUser);
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");
        } else {
            setEditedUser(user);
            setIsEditing(true);
        }
    };

    const cancelEdit = () => {
        setEditedUser(user);
        setIsEditing(false);
    };

    const pingBackend = async () => {
        try {
            const res = await api.get('/health');
            setHealthStatus(`OK: ${res.data?.timestamp ?? Date.now()}`);
        } catch (e: any) {
            setHealthStatus(`Error: ${e?.message ?? 'Backend unreachable'}`);
        }
    };

    const InfoCard = ({ icon, label, field, value, color = colors.tint, keyboardType = 'default' }: { icon: any, label: string, field: keyof UserProfile, value: string | number, color?: string, keyboardType?: any }) => (
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={styles.infoCardHeader}>
                <Ionicons name={icon} size={20} color={color} style={styles.infoCardIcon} />
                <Text style={[styles.infoCardLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
            </View>
            {isEditing ? (
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db' }]}
                    value={String(editedUser[field] || '')}
                    onChangeText={(text) => setEditedUser({ ...editedUser, [field]: keyboardType === 'numeric' ? Number(text) : text })}
                    keyboardType={keyboardType}
                />
            ) : (
                <Text style={[styles.infoCardValue, { color: colors.text }]}>{value || '-'}</Text>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={isEditing ? cancelEdit : () => { }} disabled={!isEditing}>
                    <Text style={[styles.headerAction, { color: isEditing ? colors.tint : 'transparent' }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                <TouchableOpacity onPress={toggleEdit}>
                    <Text style={[styles.headerAction, { color: colors.tint, fontWeight: 'bold' }]}>
                        {isEditing ? 'Done' : 'Edit'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Profile Avatar & Name */}
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatarContainer, { borderColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                            <Text style={[styles.avatarText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {user?.firstName ? user.firstName[0] : 'U'}
                            </Text>
                        </View>

                        {isEditing ? (
                            <View style={styles.nameInputContainer}>
                                <TextInput
                                    style={[styles.input, styles.nameInput, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db', marginRight: 8 }]}
                                    value={editedUser.firstName}
                                    onChangeText={(text) => setEditedUser({ ...editedUser, firstName: text })}
                                    placeholder="First Name"
                                />
                                <TextInput
                                    style={[styles.input, styles.nameInput, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db' }]}
                                    value={editedUser.lastName}
                                    onChangeText={(text) => setEditedUser({ ...editedUser, lastName: text })}
                                    placeholder="Last Name"
                                />
                            </View>
                        ) : (
                            <Text style={[styles.userName, { color: colors.text }]}>
                                {user?.firstName} {user?.lastName}
                            </Text>
                        )}

                        <Text style={[styles.userEmail, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {user?.email}
                        </Text>

                        <View style={styles.locationContainer}>
                            <Ionicons name="location-sharp" size={14} color={colors.tint} />
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db', marginLeft: 8, minWidth: 150 }]}
                                    value={editedUser.location}
                                    onChangeText={(text) => setEditedUser({ ...editedUser, location: text })}
                                    placeholder="Location"
                                />
                            ) : (
                                <Text style={[styles.locationText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{user.location}</Text>
                            )}
                        </View>
                    </View>

                    {/* Health Stats Grid */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Profile</Text>

                    <View style={styles.statsGrid}>
                        <InfoCard
                            icon="calendar"
                            label="Age"
                            field="age"
                            value={`${user?.age} yrs`}
                            color="#10b981" // emerald-500
                            keyboardType="numeric"
                        />
                        <InfoCard
                            icon="body"
                            label="Body Type"
                            field="bodyType"
                            value={user?.bodyType || '-'}
                            color="#f59e0b" // amber-500
                        />
                        <InfoCard
                            icon="resize"
                            label="Height"
                            field="height"
                            value={`${user?.height} cm`}
                            color="#3b82f6" // blue-500
                            keyboardType="numeric"
                        />
                        <InfoCard
                            icon="scale"
                            label="Weight"
                            field="weight"
                            value={`${user?.weight} kg`}
                            color="#ec4899" // pink-500
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Lifestyle Section */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Lifestyle</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>

                        <View style={[styles.lifestyleRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Ionicons name="walk" size={20} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Activity Level</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db', marginTop: 4 }]}
                                        value={editedUser.activityLevel}
                                        onChangeText={(text) => setEditedUser({ ...editedUser, activityLevel: text })}
                                    />
                                ) : (
                                    <Text style={[styles.rowValue, { color: colors.text }]}>{user?.activityLevel}</Text>
                                )}
                            </View>
                        </View>

                        <View style={[styles.lifestyleRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="briefcase" size={20} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Job Type</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db', marginTop: 4 }]}
                                        value={editedUser.jobType}
                                        onChangeText={(text) => setEditedUser({ ...editedUser, jobType: text })}
                                    />
                                ) : (
                                    <Text style={[styles.rowValue, { color: colors.text }]}>{user?.jobType}</Text>
                                )}
                            </View>
                        </View>

                        <View style={[styles.lifestyleRow, { borderBottomWidth: 0 }]}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                                <Ionicons name="footsteps" size={20} color="#ec4899" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Daily Step Goal</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: isDark ? '#4b5563' : '#d1d5db', marginTop: 4 }]}
                                        value={String(editedUser.averageSteps)}
                                        onChangeText={(text) => setEditedUser({ ...editedUser, averageSteps: Number(text) })}
                                        keyboardType="numeric"
                                    />
                                ) : (
                                    <Text style={[styles.rowValue, { color: colors.text }]}>{user?.averageSteps || 8000}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Account Info */}
                    <View style={[styles.card, { marginTop: 8, backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        <View style={styles.accountRow}>
                            <Text style={[styles.accountLabel, { color: colors.text }]}>Member Since</Text>
                            <Text style={[styles.accountValue, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Dec 2024</Text>
                        </View>
                    </View>

                    {/* Settings Section */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Settings</Text>

                    {/* Logout Button (Only show when not editing) */}
                    {!isEditing && (
                        <TouchableOpacity onPress={handleSignOut} style={[styles.logoutButtonRow, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}>
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" style={{ marginRight: 12 }} />
                            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600', fontFamily: 'BricolageGrotesque' }}>Sign Out</Text>
                        </TouchableOpacity>
                    )}

                    {/* System Status - simplified */}
                    <View style={{ height: 20 }} />

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    headerAction: {
        fontSize: 16,
        fontFamily: 'BricolageGrotesque',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    profileHeader: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatarContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    nameInputContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    nameInput: {
        width: 120,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
        fontFamily: 'BricolageGrotesque',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    locationText: {
        fontSize: 12,
        marginLeft: 4,
        fontFamily: 'BricolageGrotesque',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginLeft: 4,
        fontFamily: 'BricolageGrotesque',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -4,
    },
    infoCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoCardIcon: {
        marginRight: 8,
    },
    infoCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },
    infoCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    input: {
        borderBottomWidth: 1,
        fontSize: 16,
        paddingVertical: 4,
        fontFamily: 'BricolageGrotesque',
    },
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    lifestyleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rowLabel: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
    },
    rowValue: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    accountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountLabel: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'BricolageGrotesque',
    },
    accountValue: {
        fontSize: 14,
        fontFamily: 'BricolageGrotesque',
    },
    logoutButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
        marginBottom: 24,
    },
});
