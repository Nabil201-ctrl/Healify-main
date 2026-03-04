import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { UserService, UserProfile, Medication } from '@/services/UserService';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { ProfileSkeleton } from '@/components/Skeletons';

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────

const SectionTitle = ({ children, color }: { children: string; color: string }) => (
    <Text style={[styles.sectionTitle, { color }]}>{children}</Text>
);

const MetaBadge = ({ label, icon, color }: { label: string; icon: string; color: string }) => (
    <View style={[styles.badge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
        <Ionicons name={icon as any} size={14} color={color} style={{ marginRight: 6 }} />
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
);

const InfoRow = ({ icon, label, value, color, isDark }: { icon: string; label: string; value: string; color: string; isDark: boolean }) => (
    <View style={[styles.infoRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
            <Text style={[styles.rowValue, { color: isDark ? '#f9fafb' : '#111827' }]}>{value || '—'}</Text>
        </View>
    </View>
);

const EditInput = ({ label, value, onChange, keyboardType = 'default', multiline = false, color, isDark }: { label: string; value: string; onChange: (t: string) => void; keyboardType?: any; multiline?: boolean; color: string; isDark: boolean }) => (
    <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
        <TextInput
            style={[styles.editInput, { color: isDark ? '#f9fafb' : '#111827', borderColor: color, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            multiline={multiline}
            placeholderTextColor="#9ca3af"
        />
    </View>
);

const ChipSelect = ({ label, options, selected, onSelect, color, isDark }: { label: string; options: string[]; selected: string; onSelect: (o: string) => void; color: string; isDark: boolean }) => (
    <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
        <View style={styles.chipRow}>
            {options.map(o => (
                <TouchableOpacity
                    key={o}
                    onPress={() => onSelect(o)}
                    style={[styles.chip, selected === o ? { backgroundColor: color, borderColor: color } : { backgroundColor: 'transparent', borderColor: isDark ? '#4b5563' : '#e2e8f0' }]}
                >
                    <Text style={[styles.chipText, { color: selected === o ? '#fff' : isDark ? '#9ca3af' : '#64748b' }]}>{o}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const ACCENT = colors.tint;
    const { signOut } = useAuth();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [edited, setEdited] = useState<UserProfile | null>(null);

    const loadUser = useCallback(async () => {
        try {
            const data = await UserService.getProfile();
            setUser(data);
            setEdited(data);
        } catch {
            Alert.alert('Error', 'Failed to load profile');
        }
    }, []);

    useFocusEffect(useCallback(() => { loadUser(); }, [loadUser]));

    if (!user) return <ProfileSkeleton />;

    const set = (field: keyof UserProfile, val: any) =>
        setEdited(prev => prev ? { ...prev, [field]: val } : null);

    const handleSave = async () => {
        if (!edited) return;
        try {
            const updated = await UserService.updateProfile(edited);
            setUser(updated);
            setEdited(updated);
            setIsEditing(false);
            Alert.alert('Saved', 'Profile updated successfully!');
        } catch {
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(); // AuthGate will detect 'unauthenticated' and redirect
        } catch {
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    // ─── READ-ONLY VIEW ──────────────────────────────────────────────────────
    if (!isEditing) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <View style={{ width: 60 }} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                    <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.editBtn, { backgroundColor: `${ACCENT}15` }]}>
                        <Ionicons name="create-outline" size={18} color={ACCENT} />
                        <Text style={[styles.editBtnText, { color: ACCENT }]}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatar, { backgroundColor: isDark ? '#1f2937' : '#f1f5f9', borderColor: isDark ? '#374151' : '#e2e8f0' }]}>
                            <Text style={[styles.avatarText, { color: ACCENT }]}>{initials}</Text>
                        </View>
                        <Text style={[styles.fullName, { color: colors.text }]}>{fullName}</Text>
                        <Text style={[styles.email, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{user.email}</Text>

                        {/* Meta Badges */}
                        <View style={styles.badgeRow}>
                            {user.location && <MetaBadge label={user.location} icon="location-sharp" color={ACCENT} />}
                            {user.maritalStatus && <MetaBadge label={user.maritalStatus} icon="heart" color="#ec4899" />}
                            {user.gender && <MetaBadge label={user.gender} icon="person" color="#3b82f6" />}
                            {user.bloodType && <MetaBadge label={user.bloodType} icon="water" color="#ef4444" />}
                        </View>
                    </View>

                    {/* ── Physical Stats ─────────────────────────────────── */}
                    <SectionTitle color={colors.text}>Physical</SectionTitle>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        <View style={styles.statsGrid}>
                            {[
                                { icon: 'calendar', label: 'Age', value: user.age ? `${user.age} yrs` : undefined, color: '#10b981' },
                                { icon: 'resize', label: 'Height', value: user.height ? `${user.height} cm` : undefined, color: '#3b82f6' },
                                { icon: 'scale', label: 'Weight', value: user.weight ? `${user.weight} kg` : undefined, color: '#f59e0b' },
                                { icon: 'body', label: 'Body Type', value: user.bodyType, color: '#8b5cf6' },
                                { icon: 'water', label: 'Blood Type', value: user.bloodType, color: '#ef4444' },
                                { icon: 'moon', label: 'Sleep', value: user.sleepHours ? `${user.sleepHours} hrs/night` : undefined, color: '#6366f1' },
                            ].map(({ icon, label, value, color }) => (
                                <View key={label} style={[styles.statCard, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
                                        <Ionicons name={icon as any} size={18} color={color} />
                                    </View>
                                    <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
                                    <Text style={[styles.statValue, { color: isDark ? '#f9fafb' : '#111827' }]}>{value || '—'}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Lifestyle ─────────────────────────────────────── */}
                    <SectionTitle color={colors.text}>Lifestyle</SectionTitle>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        <InfoRow icon="walk" label="Activity Level" value={user.activityLevel ?? ''} color="#10b981" isDark={isDark} />
                        <InfoRow icon="briefcase" label="Job Type" value={user.jobType ?? ''} color="#3b82f6" isDark={isDark} />
                        <InfoRow icon="footsteps" label="Daily Steps Goal" value={user.averageSteps ? `${user.averageSteps.toLocaleString()} steps` : ''} color="#f59e0b" isDark={isDark} />
                        <InfoRow icon="flame" label="Smoking" value={user.smokingStatus ?? ''} color="#ef4444" isDark={isDark} />
                        <InfoRow icon="wine" label="Alcohol Use" value={user.alcoholUse ?? ''} color="#8b5cf6" isDark={isDark} />
                        {user.daysLessActive && user.daysLessActive.length > 0 && (
                            <View style={[styles.infoRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6', borderBottomWidth: 0 }]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#6366f115' }]}>
                                    <Ionicons name="calendar-outline" size={18} color="#6366f1" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Less Active Days</Text>
                                    <View style={styles.tagRow}>
                                        {user.daysLessActive.map(d => (
                                            <View key={d} style={[styles.tag, { backgroundColor: '#6366f115' }]}>
                                                <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '600' }}>{d}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Personal ──────────────────────────────────────── */}
                    <SectionTitle color={colors.text}>Personal</SectionTitle>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        <InfoRow icon="heart" label="Marital Status" value={user.maritalStatus ?? ''} color="#ec4899" isDark={isDark} />
                        <InfoRow icon="people" label="Children" value={user.hasChildren ? (user.numberOfChildren ? `Yes · ${user.numberOfChildren}` : 'Yes') : user.hasChildren === false ? 'No' : ''} color="#f59e0b" isDark={isDark} />
                        <InfoRow icon="location-sharp" label="Location" value={user.location ?? ''} color={ACCENT} isDark={isDark} />
                    </View>

                    {/* ── Medical ───────────────────────────────────────── */}
                    <SectionTitle color={colors.text}>Medical</SectionTitle>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        {/* Health Issues */}
                        {user.healthIssues && user.healthIssues.length > 0 && (
                            <View style={[styles.infoRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#ef444415' }]}>
                                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Health Issues</Text>
                                    <View style={styles.tagRow}>
                                        {user.healthIssues.map(h => (
                                            <View key={h} style={[styles.tag, { backgroundColor: '#ef444415' }]}>
                                                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>{h}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Chronic Conditions */}
                        {user.chronicConditions && user.chronicConditions.length > 0 && (
                            <View style={[styles.infoRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#f59e0b15' }]}>
                                    <Ionicons name="pulse" size={18} color="#f59e0b" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Chronic Conditions</Text>
                                    <View style={styles.tagRow}>
                                        {user.chronicConditions.map(c => (
                                            <View key={c} style={[styles.tag, { backgroundColor: '#f59e0b15' }]}>
                                                <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>{c}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Allergies */}
                        {user.allergies && user.allergies.length > 0 && (
                            <View style={[styles.infoRow, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#8b5cf615' }]}>
                                    <Ionicons name="warning" size={18} color="#8b5cf6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Allergies</Text>
                                    <View style={styles.tagRow}>
                                        {user.allergies.map(a => (
                                            <View key={a} style={[styles.tag, { backgroundColor: '#8b5cf615' }]}>
                                                <Text style={{ color: '#8b5cf6', fontSize: 12, fontWeight: '600' }}>{a}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Medications */}
                        {user.medications && user.medications.length > 0 ? (
                            <View>
                                <View style={[styles.iconCircle, { backgroundColor: '#10b98115', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', margin: 16, marginBottom: 8 }]}>
                                    <Ionicons name="medkit" size={18} color="#10b981" />
                                </View>
                                <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280', paddingHorizontal: 16, marginBottom: 8 }]}>Medications</Text>
                                {user.medications.map((med: Medication, i: number) => (
                                    <View key={i} style={[styles.medCard, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: isDark ? '#374151' : '#e5e7eb', marginHorizontal: 12, marginBottom: 8 }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={[styles.medName, { color: isDark ? '#f9fafb' : '#111827' }]}>{med.name}</Text>
                                            {med.endDate && (
                                                <View style={[styles.tag, { backgroundColor: '#10b98115', marginLeft: 8 }]}>
                                                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '600' }}>Until {med.endDate}</Text>
                                                </View>
                                            )}
                                        </View>
                                        {med.reason ? <Text style={[styles.medMeta, { color: isDark ? '#9ca3af' : '#6b7280' }]}>For: {med.reason}</Text> : null}
                                        {med.dosage ? <Text style={[styles.medMeta, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Dose: {med.dosage}</Text> : null}
                                    </View>
                                ))}
                                <View style={{ height: 8 }} />
                            </View>
                        ) : (
                            <InfoRow icon="medkit" label="Medications" value="None" color="#10b981" isDark={isDark} />
                        )}
                    </View>

                    {/* ── Emergency Contact ─────────────────────────────── */}
                    {(user.emergencyContactName || user.emergencyContactPhone) && (
                        <>
                            <SectionTitle color={colors.text}>Emergency Contact</SectionTitle>
                            <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                <InfoRow icon="person-outline" label="Name" value={user.emergencyContactName ?? ''} color="#f59e0b" isDark={isDark} />
                                <InfoRow icon="call-outline" label="Phone" value={user.emergencyContactPhone ?? ''} color="#10b981" isDark={isDark} />
                            </View>
                        </>
                    )}

                    {/* ── Integrations ─────────────────────────────────────── */}
                    <SectionTitle color={colors.text}>Integrations</SectionTitle>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', marginBottom: 20 }]}>
                        <View style={[styles.infoRow, { justifyContent: 'space-between', borderBottomWidth: 0 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.iconCircle, { backgroundColor: '#10b98115' }]}>
                                    <Ionicons name="fitness" size={18} color="#10b981" />
                                </View>
                                <View>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 2 }]}>Google Fit / Health Connect</Text>
                                    <Text style={[styles.rowValue, { color: isDark ? '#f9fafb' : '#111827', fontSize: 13 }]}>
                                        {user.isHealthSyncAllowed ? 'Syncing actively' : 'Sync disabled'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        const newState = !user.isHealthSyncAllowed;
                                        await UserService.setHealthSync(newState);
                                        setUser({ ...user, isHealthSyncAllowed: newState });
                                    } catch (e) {
                                        Alert.alert('Error', 'Could not update sync status');
                                    }
                                }}
                                style={{
                                    backgroundColor: user.isHealthSyncAllowed ? '#10b981' : isDark ? '#374151' : '#e5e7eb',
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                }}
                            >
                                <Text style={{ color: user.isHealthSyncAllowed ? 'white' : isDark ? '#9ca3af' : '#6b7280', fontWeight: 'bold' }}>
                                    {user.isHealthSyncAllowed ? 'Disconnect' : 'Connect'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Account ────────────────────────────────────────── */}
                    <SectionTitle color={colors.text}>Account</SectionTitle>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    // ─── EDIT MODE ───────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => { setEdited(user); setIsEditing(false); }}>
                    <Text style={{ color: '#9ca3af', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} style={[styles.editBtn, { backgroundColor: `${ACCENT}15` }]}>
                    <Text style={[styles.editBtnText, { color: ACCENT, fontWeight: 'bold' }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 60 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    <Text style={[styles.editSectionTitle, { color: colors.text }]}>Physical</Text>
                    <View style={styles.editGroup}>
                        <View style={styles.editRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <EditInput label="Age" value={String(edited?.age ?? '')} onChange={v => set('age', Number(v))} keyboardType="numeric" color={ACCENT} isDark={isDark} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <EditInput label="Sleep hrs/night" value={String(edited?.sleepHours ?? '')} onChange={v => set('sleepHours', Number(v))} keyboardType="numeric" color={ACCENT} isDark={isDark} />
                            </View>
                        </View>
                        <View style={styles.editRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <EditInput label="Height (cm)" value={String(edited?.height ?? '')} onChange={v => set('height', Number(v))} keyboardType="numeric" color={ACCENT} isDark={isDark} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <EditInput label="Weight (kg)" value={String(edited?.weight ?? '')} onChange={v => set('weight', Number(v))} keyboardType="numeric" color={ACCENT} isDark={isDark} />
                            </View>
                        </View>
                        <ChipSelect label="Gender" options={['Male', 'Female', 'Non-binary', 'Prefer not to say']} selected={edited?.gender ?? ''} onSelect={v => set('gender', v)} color={ACCENT} isDark={isDark} />
                        <ChipSelect label="Body Type" options={['Slim', 'Lean', 'Average', 'Athletic', 'Overweight']} selected={edited?.bodyType ?? ''} onSelect={v => set('bodyType', v)} color={ACCENT} isDark={isDark} />
                        <ChipSelect label="Blood Type" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']} selected={edited?.bloodType ?? ''} onSelect={v => set('bloodType', v)} color="#ef4444" isDark={isDark} />
                    </View>

                    <Text style={[styles.editSectionTitle, { color: colors.text }]}>Lifestyle</Text>
                    <View style={styles.editGroup}>
                        <ChipSelect label="Activity Level" options={['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active']} selected={edited?.activityLevel ?? ''} onSelect={v => set('activityLevel', v)} color="#10b981" isDark={isDark} />
                        <ChipSelect label="Job Type" options={['Active', 'Office', 'Mixed']} selected={edited?.jobType ?? ''} onSelect={v => set('jobType', v)} color="#3b82f6" isDark={isDark} />
                        <EditInput label="Daily Steps Goal" value={String(edited?.averageSteps ?? '')} onChange={v => set('averageSteps', Number(v))} keyboardType="numeric" color={ACCENT} isDark={isDark} />
                        <ChipSelect label="Smoking Status" options={['Never', 'Former', 'Current']} selected={edited?.smokingStatus ?? ''} onSelect={v => set('smokingStatus', v)} color="#ef4444" isDark={isDark} />
                        <ChipSelect label="Alcohol Use" options={['None', 'Occasional', 'Moderate', 'Heavy']} selected={edited?.alcoholUse ?? ''} onSelect={v => set('alcoholUse', v)} color="#8b5cf6" isDark={isDark} />
                    </View>

                    <Text style={[styles.editSectionTitle, { color: colors.text }]}>Personal</Text>
                    <View style={styles.editGroup}>
                        <ChipSelect label="Marital Status" options={['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say']} selected={edited?.maritalStatus ?? ''} onSelect={v => set('maritalStatus', v)} color="#ec4899" isDark={isDark} />
                        <EditInput label="Location" value={edited?.location ?? ''} onChange={v => set('location', v)} color={ACCENT} isDark={isDark} />
                    </View>

                    <Text style={[styles.editSectionTitle, { color: colors.text }]}>Medical</Text>
                    <View style={styles.editGroup}>
                        <EditInput label="Health Issues (comma-separated)" value={(edited?.healthIssues ?? []).join(', ')} onChange={v => set('healthIssues', v.split(',').map((s: string) => s.trim()).filter(Boolean))} multiline color="#ef4444" isDark={isDark} />
                        <EditInput label="Chronic Conditions (comma-separated)" value={(edited?.chronicConditions ?? []).join(', ')} onChange={v => set('chronicConditions', v.split(',').map((s: string) => s.trim()).filter(Boolean))} multiline color="#f59e0b" isDark={isDark} />
                        <EditInput label="Allergies (comma-separated)" value={(edited?.allergies ?? []).join(', ')} onChange={v => set('allergies', v.split(',').map((s: string) => s.trim()).filter(Boolean))} multiline color="#8b5cf6" isDark={isDark} />
                    </View>

                    <Text style={[styles.editSectionTitle, { color: colors.text }]}>Emergency Contact</Text>
                    <View style={styles.editGroup}>
                        <EditInput label="Full Name" value={edited?.emergencyContactName ?? ''} onChange={v => set('emergencyContactName', v)} color="#f59e0b" isDark={isDark} />
                        <EditInput label="Phone Number" value={edited?.emergencyContactPhone ?? ''} onChange={v => set('emergencyContactPhone', v)} keyboardType="phone-pad" color="#10b981" isDark={isDark} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
        fontFamily: 'BricolageGrotesque',
    },
    scroll: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    // Avatar
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 28,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    fullName: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        fontFamily: 'BricolageGrotesque',
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginHorizontal: 4,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },
    // Section
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        marginTop: 20,
        marginBottom: 10,
        marginLeft: 2,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
    },
    statCard: {
        width: '30%',
        margin: '1.66%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        alignItems: 'center',
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        fontFamily: 'BricolageGrotesque',
        textAlign: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        textAlign: 'center',
    },
    // Info Rows
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    rowLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        fontFamily: 'BricolageGrotesque',
        marginBottom: 3,
    },
    rowValue: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        gap: 6,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginRight: 4,
        marginBottom: 2,
    },
    // Medications
    medCard: {
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
    },
    medName: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    medMeta: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
        marginTop: 2,
    },
    // Sign out
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
    },
    signOutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
        fontFamily: 'BricolageGrotesque',
    },
    // Edit Mode
    editSectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        marginTop: 24,
        marginBottom: 12,
    },
    editGroup: {
        backgroundColor: 'transparent',
    },
    editField: {
        marginBottom: 16,
    },
    editLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        fontFamily: 'BricolageGrotesque',
    },
    editInput: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        fontFamily: 'BricolageGrotesque',
    },
    editRow: {
        flexDirection: 'row',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        marginRight: 8,
        marginBottom: 8,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },
});
