import React, { useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, Animated,
    Dimensions, StyleSheet, StatusBar, SafeAreaView,
    TextInput, ScrollView, KeyboardAvoidingView,
    Platform, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { UserService, Medication } from '@/services/UserService';

const { width } = Dimensions.get('window');

// ─── INTRO SLIDES ────────────────────────────────────────────────────────────
const slides = [
    { id: '1', title: 'Welcome to Healify', description: 'Your complete personal health companion, built for your daily life.', icon: 'heart-o', color: '#3B82F6', gradient: ['#eff6ff', '#dbeafe'] as [string, string] },
    { id: '2', title: 'Understand Your Health', description: 'Track symptoms and gain insights into what truly matters for your well-being.', icon: 'heartbeat', color: '#10B981', gradient: ['#ecfdf5', '#d1fae5'] as [string, string] },
    { id: '3', title: 'Track Your Vitals', description: 'Monitor stats, sleep patterns, and daily activity in one unified dashboard.', icon: 'bar-chart', color: '#F59E0B', gradient: ['#fffbeb', '#fef3c7'] as [string, string] },
    { id: '4', title: 'AI-Powered Insights', description: 'Receive personalised health tips and preventive care reminders just for you.', icon: 'lightbulb-o', color: '#8B5CF6', gradient: ['#f5f3ff', '#ede9fe'] as [string, string] },
    { id: '5', title: 'Ready to Begin?', description: "Let's build your health profile so we can tailor everything to your needs.", icon: 'rocket', color: '#EC4899', gradient: ['#fdf2f8', '#fce7f3'] as [string, string] },
];

// ─── SETUP STEP CONFIG ────────────────────────────────────────────────────────
const STEP_LABELS = ['You', 'Lifestyle', 'Personal', 'Medical', 'Emergency'];
const STEP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const Chip = ({ label, selected, color, onPress }: { label: string; selected: boolean; color: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[chipStyles.chip, selected ? { backgroundColor: color, borderColor: color } : chipStyles.unselected]}>
        <Text style={[chipStyles.text, { color: selected ? '#fff' : '#64748b' }]}>{label}</Text>
    </TouchableOpacity>
);

const SLabel = ({ children }: { children: string }) => (
    <Text style={ss.label}>{children}</Text>
);

const SInput = ({ ...props }: React.ComponentProps<typeof TextInput>) => (
    <TextInput style={ss.input} placeholderTextColor="#94a3b8" {...props} />
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function OnboardingScreen() {
    const router = useRouter();
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const [slideIndex, setSlideIndex] = useState(0);
    const [showSetup, setShowSetup] = useState(false);
    const [setupStep, setSetupStep] = useState(0); // 0-4
    const [saving, setSaving] = useState(false);

    // ── Step 1: You ──────────────────────
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bodyType, setBodyType] = useState('');
    const [bloodType, setBloodType] = useState('');

    // ── Step 2: Lifestyle ─────────────────
    const [activityLevel, setActivityLevel] = useState('');
    const [jobType, setJobType] = useState('');
    const [averageSteps, setAverageSteps] = useState('');
    const [sleepHours, setSleepHours] = useState('');
    const [smokingStatus, setSmokingStatus] = useState('');
    const [alcoholUse, setAlcoholUse] = useState('');
    const [daysLessActive, setDaysLessActive] = useState<string[]>([]);

    // ── Step 3: Personal ──────────────────
    const [maritalStatus, setMaritalStatus] = useState('');
    const [hasChildren, setHasChildren] = useState<boolean | null>(null);
    const [numberOfChildren, setNumberOfChildren] = useState('');
    const [location, setLocation] = useState('');

    // ── Step 4: Medical ───────────────────
    const [healthIssues, setHealthIssues] = useState('');
    const [allergies, setAllergies] = useState('');
    const [chronicConditions, setChronicConditions] = useState('');
    const [medications, setMedications] = useState<Medication[]>([]);
    const [medName, setMedName] = useState('');
    const [medReason, setMedReason] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medEndDate, setMedEndDate] = useState('');
    const [onMedication, setOnMedication] = useState<boolean | null>(null);

    // ── Step 5: Emergency ─────────────────
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

    const toggleDay = (day: string) => setDaysLessActive(prev =>
        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );

    const addMedication = () => {
        if (!medName.trim()) return;
        setMedications(prev => [...prev, { name: medName.trim(), reason: medReason.trim(), dosage: medDosage.trim(), endDate: medEndDate.trim() }]);
        setMedName(''); setMedReason(''); setMedDosage(''); setMedEndDate('');
    };

    const removeMedication = (i: number) => setMedications(prev => prev.filter((_, idx) => idx !== i));

    // ─── Navigation ───────────────────────────────────────────────────────────
    const handleSlideNext = () => {
        if (slideIndex < slides.length - 1) {
            const next = slideIndex + 1;
            flatListRef.current?.scrollToOffset({ offset: next * width, animated: true });
            setSlideIndex(next);
        } else {
            setShowSetup(true);
        }
    };

    const handleSetupNext = () => {
        if (setupStep < STEP_LABELS.length - 1) {
            setSetupStep(s => s + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSetupBack = () => {
        if (setupStep > 0) setSetupStep(s => s - 1);
        else setShowSetup(false);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await UserService.updateProfile({
                age: age ? Number(age) : undefined,
                gender: gender || undefined,
                height: height ? Number(height) : undefined,
                weight: weight ? Number(weight) : undefined,
                bodyType: bodyType || undefined,
                bloodType: bloodType || undefined,
                activityLevel: activityLevel || undefined,
                jobType: jobType || undefined,
                averageSteps: averageSteps ? Number(averageSteps) : undefined,
                sleepHours: sleepHours ? Number(sleepHours) : undefined,
                smokingStatus: smokingStatus || undefined,
                alcoholUse: alcoholUse || undefined,
                daysLessActive,
                maritalStatus: maritalStatus || undefined,
                hasChildren: hasChildren ?? undefined,
                numberOfChildren: numberOfChildren ? Number(numberOfChildren) : undefined,
                location: location || undefined,
                healthIssues: healthIssues.split(',').map(s => s.trim()).filter(Boolean),
                allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
                chronicConditions: chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
                medications: onMedication ? medications : [],
                emergencyContactName: emergencyContactName || undefined,
                emergencyContactPhone: emergencyContactPhone || undefined,
                isProfileComplete: true,
                onboardingStatus: 'COMPLETED',
            });
            router.replace('/(tabs)');
        } catch (e) {
            Alert.alert('Error', 'Could not save your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ─── INTRO SLIDES ────────────────────────────────────────────────────────
    if (!showSetup) {
        const currentSlide = slides[slideIndex];
        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="dark-content" />
                <LinearGradient colors={currentSlide.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 24 }}>
                        <TouchableOpacity onPress={() => setShowSetup(true)} style={introStyles.skip}>
                            <Text style={{ color: '#475569', fontWeight: '600', fontSize: 14 }}>Skip</Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.FlatList
                        data={slides}
                        ref={flatListRef}
                        keyExtractor={i => i.id}
                        horizontal pagingEnabled bounces={false}
                        showsHorizontalScrollIndicator={false}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                        onMomentumScrollEnd={e => setSlideIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                        scrollEventThrottle={16}
                        style={{ flex: 1 }}
                        renderItem={({ item }) => (
                            <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                                <View style={[introStyles.iconBox, { shadowColor: item.color }]}>
                                    <FontAwesome name={item.icon as any} size={80} color={item.color} />
                                </View>
                                <Text style={introStyles.title}>{item.title}</Text>
                                <Text style={introStyles.desc}>{item.description}</Text>
                            </View>
                        )}
                    />

                    <View style={{ paddingHorizontal: 32, paddingBottom: 48 }}>
                        {/* Dots */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
                            {slides.map((_, i) => (
                                <Animated.View key={i} style={[introStyles.dot, {
                                    width: scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [10, 30, 10], extrapolate: 'clamp' }),
                                    opacity: scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }),
                                    backgroundColor: currentSlide.color,
                                }]} />
                            ))}
                        </View>
                        <TouchableOpacity onPress={handleSlideNext} style={[introStyles.nextBtn, { backgroundColor: currentSlide.color, shadowColor: currentSlide.color }]} activeOpacity={0.9}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                {slideIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                            </Text>
                            <FontAwesome name="arrow-right" size={18} color="white" style={{ position: 'absolute', right: 24 }} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // ─── SETUP WIZARD ────────────────────────────────────────────────────────
    const stepColor = STEP_COLORS[setupStep];
    const progressPct = ((setupStep + 1) / STEP_LABELS.length) * 100;

    const renderStep = () => {
        switch (setupStep) {
            // ── STEP 0: You ────────────────────────────────────────────────
            case 0: return (
                <View>
                    <View style={ss.stepIcon}>
                        <Ionicons name="person" size={32} color={stepColor} />
                    </View>
                    <Text style={ss.stepTitle}>About You</Text>
                    <Text style={ss.stepSub}>Help us personalise your experience.</Text>

                    <SLabel>Gender</SLabel>
                    <View style={ss.chipRow}>
                        {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(o => (
                            <Chip key={o} label={o} selected={gender === o} color={stepColor} onPress={() => setGender(o)} />
                        ))}
                    </View>

                    <View style={ss.row}>
                        <View style={ss.halfCol}>
                            <SLabel>Age</SLabel>
                            <SInput keyboardType="numeric" value={age} onChangeText={setAge} placeholder="e.g. 28" />
                        </View>
                        <View style={ss.halfCol}>
                            <SLabel>Height (cm)</SLabel>
                            <SInput keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 175" />
                        </View>
                    </View>

                    <View style={ss.row}>
                        <View style={ss.halfCol}>
                            <SLabel>Weight (kg)</SLabel>
                            <SInput keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="e.g. 72" />
                        </View>
                        <View style={ss.halfCol}>
                            <SLabel>Sleep (hrs/night)</SLabel>
                            <SInput keyboardType="numeric" value={sleepHours} onChangeText={setSleepHours} placeholder="e.g. 7" />
                        </View>
                    </View>

                    <SLabel>Body Type</SLabel>
                    <View style={ss.chipRow}>
                        {['Slim', 'Lean', 'Average', 'Athletic', 'Overweight'].map(o => (
                            <Chip key={o} label={o} selected={bodyType === o} color={stepColor} onPress={() => setBodyType(o)} />
                        ))}
                    </View>

                    <SLabel>Blood Type</SLabel>
                    <View style={ss.chipRow}>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(o => (
                            <Chip key={o} label={o} selected={bloodType === o} color={stepColor} onPress={() => setBloodType(o)} />
                        ))}
                    </View>
                </View>
            );

            // ── STEP 1: Lifestyle ──────────────────────────────────────────
            case 1: return (
                <View>
                    <View style={ss.stepIcon}>
                        <Ionicons name="walk" size={32} color={stepColor} />
                    </View>
                    <Text style={ss.stepTitle}>Your Lifestyle</Text>
                    <Text style={ss.stepSub}>Your daily habits shape your health.</Text>

                    <SLabel>Activity Level</SLabel>
                    <View style={ss.chipRow}>
                        {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map(o => (
                            <Chip key={o} label={o} selected={activityLevel === o} color={stepColor} onPress={() => setActivityLevel(o)} />
                        ))}
                    </View>

                    <SLabel>Job Type</SLabel>
                    <View style={ss.chipRow}>
                        {['Active', 'Office', 'Mixed'].map(o => (
                            <Chip key={o} label={o} selected={jobType === o} color={stepColor} onPress={() => setJobType(o)} />
                        ))}
                    </View>

                    <SLabel>Average Daily Steps</SLabel>
                    <SInput keyboardType="numeric" value={averageSteps} onChangeText={setAverageSteps} placeholder="e.g. 8000" />

                    <SLabel>Less Active Days</SLabel>
                    <View style={ss.chipRow}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <Chip key={day} label={day} selected={daysLessActive.includes(day)} color={stepColor} onPress={() => toggleDay(day)} />
                        ))}
                    </View>

                    <SLabel>Smoking Status</SLabel>
                    <View style={ss.chipRow}>
                        {['Never', 'Former', 'Current'].map(o => (
                            <Chip key={o} label={o} selected={smokingStatus === o} color={stepColor} onPress={() => setSmokingStatus(o)} />
                        ))}
                    </View>

                    <SLabel>Alcohol Use</SLabel>
                    <View style={ss.chipRow}>
                        {['None', 'Occasional', 'Moderate', 'Heavy'].map(o => (
                            <Chip key={o} label={o} selected={alcoholUse === o} color={stepColor} onPress={() => setAlcoholUse(o)} />
                        ))}
                    </View>
                </View>
            );

            // ── STEP 2: Personal ───────────────────────────────────────────
            case 2: return (
                <View>
                    <View style={ss.stepIcon}>
                        <Ionicons name="people" size={32} color={stepColor} />
                    </View>
                    <Text style={ss.stepTitle}>Personal Info</Text>
                    <Text style={ss.stepSub}>Helps us understand your personal context.</Text>

                    <SLabel>Marital Status</SLabel>
                    <View style={ss.chipRow}>
                        {['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'].map(o => (
                            <Chip key={o} label={o} selected={maritalStatus === o} color={stepColor} onPress={() => setMaritalStatus(o)} />
                        ))}
                    </View>

                    <SLabel>Do you have children?</SLabel>
                    <View style={ss.chipRow}>
                        <Chip label="Yes" selected={hasChildren === true} color={stepColor} onPress={() => setHasChildren(true)} />
                        <Chip label="No" selected={hasChildren === false} color={stepColor} onPress={() => setHasChildren(false)} />
                    </View>

                    {hasChildren && (
                        <>
                            <SLabel>Number of Children</SLabel>
                            <SInput keyboardType="numeric" value={numberOfChildren} onChangeText={setNumberOfChildren} placeholder="e.g. 2" />
                        </>
                    )}

                    <SLabel>City / Location</SLabel>
                    <SInput value={location} onChangeText={setLocation} placeholder="e.g. Lagos, Nigeria" />
                </View>
            );

            // ── STEP 3: Medical ────────────────────────────────────────────
            case 3: return (
                <View>
                    <View style={ss.stepIcon}>
                        <Ionicons name="medkit" size={32} color={stepColor} />
                    </View>
                    <Text style={ss.stepTitle}>Health & Medical</Text>
                    <Text style={ss.stepSub}>All information is private and encrypted.</Text>

                    <SLabel>Health Issues (comma-separated)</SLabel>
                    <SInput value={healthIssues} onChangeText={setHealthIssues} placeholder="e.g. Asthma, Migraines" multiline />

                    <SLabel>Chronic Conditions (comma-separated)</SLabel>
                    <SInput value={chronicConditions} onChangeText={setChronicConditions} placeholder="e.g. Diabetes, Hypertension" multiline />

                    <SLabel>Allergies (comma-separated)</SLabel>
                    <SInput value={allergies} onChangeText={setAllergies} placeholder="e.g. Peanuts, Penicillin" multiline />

                    <SLabel>Are you currently on medication?</SLabel>
                    <View style={ss.chipRow}>
                        <Chip label="Yes" selected={onMedication === true} color={stepColor} onPress={() => setOnMedication(true)} />
                        <Chip label="No" selected={onMedication === false} color={stepColor} onPress={() => setOnMedication(false)} />
                    </View>

                    {onMedication && (
                        <View style={ss.medicationSection}>
                            <Text style={ss.medSectionTitle}>Add Medications</Text>

                            <SLabel>Medication Name</SLabel>
                            <SInput value={medName} onChangeText={setMedName} placeholder="e.g. Metformin" />

                            <SLabel>What is it for?</SLabel>
                            <SInput value={medReason} onChangeText={setMedReason} placeholder="e.g. Type 2 Diabetes management" />

                            <SLabel>Dosage (optional)</SLabel>
                            <SInput value={medDosage} onChangeText={setMedDosage} placeholder="e.g. 500mg twice daily" />

                            <SLabel>End Date (optional – DD/MM/YYYY)</SLabel>
                            <SInput value={medEndDate} onChangeText={setMedEndDate} placeholder="e.g. 31/12/2025 or 'Ongoing'" />

                            <TouchableOpacity onPress={addMedication} style={[ss.addMedBtn, { backgroundColor: stepColor }]} disabled={!medName.trim()}>
                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Add Medication</Text>
                            </TouchableOpacity>

                            {medications.length > 0 && (
                                <View style={ss.medList}>
                                    {medications.map((m, i) => (
                                        <View key={i} style={ss.medCard}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={ss.medName}>{m.name}</Text>
                                                {m.reason ? <Text style={ss.medMeta}>For: {m.reason}</Text> : null}
                                                {m.dosage ? <Text style={ss.medMeta}>Dose: {m.dosage}</Text> : null}
                                                {m.endDate ? <Text style={ss.medMeta}>Until: {m.endDate}</Text> : null}
                                            </View>
                                            <TouchableOpacity onPress={() => removeMedication(i)}>
                                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );

            // ── STEP 4: Emergency ──────────────────────────────────────────
            case 4: return (
                <View>
                    <View style={ss.stepIcon}>
                        <Ionicons name="call" size={32} color={stepColor} />
                    </View>
                    <Text style={ss.stepTitle}>Emergency Contact</Text>
                    <Text style={ss.stepSub}>Who should we contact in an emergency?</Text>

                    <SLabel>Contact Full Name</SLabel>
                    <SInput value={emergencyContactName} onChangeText={setEmergencyContactName} placeholder="e.g. Jane Doe" />

                    <SLabel>Phone Number</SLabel>
                    <SInput value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} placeholder="e.g. +234 801 234 5678" keyboardType="phone-pad" />

                    <View style={ss.summaryBox}>
                        <Text style={ss.summaryTitle}>Profile Summary</Text>
                        {[
                            { icon: 'person', label: `${gender || '--'}, ${age || '--'} yrs` },
                            { icon: 'fitness', label: `${height || '--'} cm · ${weight || '--'} kg` },
                            { icon: 'walk', label: activityLevel || '--' },
                            { icon: 'people', label: maritalStatus || '--' },
                            { icon: 'water', label: bloodType || '--' },
                            { icon: 'medical', label: onMedication && medications.length > 0 ? `${medications.length} medication(s)` : 'None' },
                        ].map(({ icon, label }) => (
                            <View key={icon} style={ss.summaryRow}>
                                <Ionicons name={icon as any} size={16} color={stepColor} style={{ marginRight: 8 }} />
                                <Text style={ss.summaryText}>{label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            );

            default: return null;
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {/* Header */}
                <View style={ss.header}>
                    <TouchableOpacity onPress={handleSetupBack} style={ss.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#334155" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={ss.headerTitle}>{STEP_LABELS[setupStep]}</Text>
                        <Text style={ss.headerSub}>Step {setupStep + 1} of {STEP_LABELS.length}</Text>
                    </View>
                    <TouchableOpacity onPress={handleSetupNext} style={ss.skipLink}>
                        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={ss.progressBar}>
                    {STEP_LABELS.map((_, i) => (
                        <View key={i} style={[ss.progressSegment, {
                            backgroundColor: i <= setupStep ? STEP_COLORS[i] : '#e2e8f0',
                            flex: 1,
                            marginHorizontal: 2,
                        }]} />
                    ))}
                </View>

                <ScrollView contentContainerStyle={ss.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {renderStep()}
                </ScrollView>

                {/* Footer */}
                <View style={ss.footer}>
                    <TouchableOpacity
                        onPress={handleSetupNext}
                        disabled={saving}
                        activeOpacity={0.9}
                        style={[ss.nextBtn, { backgroundColor: stepColor, shadowColor: stepColor }]}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={ss.nextBtnText}>
                                    {setupStep === STEP_LABELS.length - 1 ? 'Complete Setup' : 'Next'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const introStyles = StyleSheet.create({
    skip: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    iconBox: { width: 180, height: 180, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 48, backgroundColor: 'white', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#1e293b' },
    desc: { fontSize: 17, color: '#64748b', textAlign: 'center', lineHeight: 26, paddingHorizontal: 16 },
    dot: { height: 10, borderRadius: 5, marginHorizontal: 6 },
    nextBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
});

const chipStyles = StyleSheet.create({
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8, marginBottom: 8 },
    unselected: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
    text: { fontSize: 14, fontWeight: '600' },
});

const ss = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
    headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    skipLink: { width: 40, alignItems: 'flex-end' },
    progressBar: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, height: 28, alignItems: 'center' },
    progressSegment: { height: 6, borderRadius: 3 },
    body: { paddingHorizontal: 24, paddingBottom: 32 },
    footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 24 : 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc' },
    stepIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' },
    stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 6 },
    stepSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
    label: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    input: { borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1e293b', marginBottom: 16 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12 },
    halfCol: { flex: 1 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    // Medication
    medicationSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8, marginBottom: 8 },
    medSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
    addMedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, marginTop: 4, marginBottom: 12 },
    medList: { gap: 8 },
    medCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    medName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    medMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
    // Summary
    summaryBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 16 },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    summaryText: { fontSize: 14, color: '#475569' },
});
