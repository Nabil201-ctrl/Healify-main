import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, ScrollView, KeyboardAvoidingView, Platform,
    Animated, StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/DoctorAuthContext';
import { useRouter } from 'expo-router';

// ─── Specializations ──────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Endocrinologist',
    'Gastroenterologist',
    'Neurologist',
    'Oncologist',
    'Ophthalmologist',
    'Orthopedic Surgeon',
    'Pediatrician',
    'Psychiatrist',
    'Pulmonologist',
    'Radiologist',
    'Rheumatologist',
    'Urologist',
    'Other',
];

// ─── Input Field ──────────────────────────────────────────────────────────────

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    error,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: any;
    autoCapitalize?: any;
    error?: string;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[
                styles.fieldWrapper,
                focused && styles.fieldFocused,
                !!error && styles.fieldError,
            ]}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType || 'default'}
                    autoCapitalize={autoCapitalize || 'words'}
                    style={styles.fieldInput}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            </View>
            {!!error && <Text style={styles.fieldErrorText}>{error}</Text>}
        </View>
    );
}

// ─── Register Screen ──────────────────────────────────────────────────────────

export default function RegisterScreen() {
    const { register } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Step 1
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 2
    const [licenseNumber, setLicenseNumber] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [showSpecPicker, setShowSpecPicker] = useState(false);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Validation ─────────────────────────────────────────────────────────────

    const validateStep1 = () => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = 'First name is required';
        if (!lastName.trim()) e.lastName = 'Last name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
        if (!password) e.password = 'Password is required';
        else if (password.length < 8) e.password = 'Password must be at least 8 characters';
        if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: Record<string, string> = {};
        if (!licenseNumber.trim()) e.licenseNumber = 'License number is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Navigation ─────────────────────────────────────────────────────────────

    const goToStep2 = () => {
        if (!validateStep1()) return;
        Animated.timing(slideAnim, {
            toValue: -1,
            duration: 280,
            useNativeDriver: true,
        }).start(() => {
            setStep(2);
            slideAnim.setValue(1);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 260,
                useNativeDriver: true,
            }).start();
        });
    };

    const goBack = () => {
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
        }).start(() => {
            setStep(1);
            slideAnim.setValue(-1);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 260,
                useNativeDriver: true,
            }).start();
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleRegister = async () => {
        if (!validateStep2()) return;

        setLoading(true);
        try {
            await register({
                email: email.trim().toLowerCase(),
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                specialization: specialization || undefined,
                licenseNumber: licenseNumber.trim(),
            });
            // Navigation handled automatically by DoctorAuthContext → _layout redirect
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    const translateX = slideAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-400, 0, 400],
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🏥</Text>
                    </View>
                    <Text style={styles.title}>Healify</Text>
                    <Text style={styles.subtitle}>Doctor Registration</Text>
                </View>

                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                    <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
                        <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
                    </View>
                    <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
                    <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
                        <Text style={[styles.stepDotText, step === 2 && styles.stepDotTextActive]}>2</Text>
                    </View>
                </View>
                <View style={styles.stepLabels}>
                    <Text style={styles.stepLabel}>Personal Info</Text>
                    <Text style={styles.stepLabel}>Credentials</Text>
                </View>

                {/* Animated Form */}
                <Animated.View style={{ transform: [{ translateX }] }}>
                    {step === 1 ? (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Personal Information</Text>

                            <View style={styles.nameRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Field
                                        label="First Name"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="John"
                                        error={errors.firstName}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Field
                                        label="Last Name"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Smith"
                                        error={errors.lastName}
                                    />
                                </View>
                            </View>

                            <Field
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="doctor@hospital.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={errors.email}
                            />
                            <Field
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Min. 8 characters"
                                secureTextEntry
                                autoCapitalize="none"
                                error={errors.password}
                            />
                            <Field
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Repeat password"
                                secureTextEntry
                                autoCapitalize="none"
                                error={errors.confirmPassword}
                            />

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={goToStep2}
                            >
                                <Text style={styles.primaryBtnText}>Continue →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Medical Credentials</Text>

                            <Field
                                label="Medical License Number"
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                placeholder="e.g. MD-2024-XXXXX"
                                autoCapitalize="characters"
                                error={errors.licenseNumber}
                            />

                            {/* Specialization picker */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Specialization (optional)</Text>
                                <TouchableOpacity
                                    style={[styles.fieldWrapper, showSpecPicker && styles.fieldFocused]}
                                    onPress={() => setShowSpecPicker(v => !v)}
                                >
                                    <Text style={[styles.specPickerText, !specialization && { color: '#94a3b8' }]}>
                                        {specialization || 'Select a specialization'}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>{showSpecPicker ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                            </View>

                            {showSpecPicker && (
                                <View style={styles.specDropdown}>
                                    <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                                        {SPECIALIZATIONS.map(spec => (
                                            <TouchableOpacity
                                                key={spec}
                                                style={[
                                                    styles.specOption,
                                                    specialization === spec && styles.specOptionActive,
                                                ]}
                                                onPress={() => {
                                                    setSpecialization(spec === 'Other' ? '' : spec);
                                                    setShowSpecPicker(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.specOptionText,
                                                    specialization === spec && styles.specOptionTextActive,
                                                ]}>
                                                    {spec}
                                                </Text>
                                                {specialization === spec && (
                                                    <Text style={{ color: '#2563eb' }}>✓</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Disclaimer */}
                            <View style={styles.disclaimer}>
                                <Text style={styles.disclaimerText}>
                                    🔒 Your license number will be verified by our medical team before your account is fully activated. Access may be limited until verification is complete.
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={goBack}>
                                    <Text style={styles.secondaryBtnText}>← Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, { flex: 1, marginLeft: 12 }, loading && styles.btnDisabled]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Create Account</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* Login link */}
                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => router.replace('/(auth)/login')}
                >
                    <Text style={styles.loginLinkText}>
                        Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 60 },

    // Header
    header: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        borderWidth: 1.5,
        borderColor: '#bfdbfe',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoEmoji: { fontSize: 34 },
    title: { fontSize: 30, fontWeight: '800', color: '#1e3a5f', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: '#64748b', marginTop: 4 },

    // Step indicator
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    stepDotActive: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
    stepDotText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
    stepDotTextActive: { color: '#fff' },
    stepLine: {
        width: 60,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
    },
    stepLineActive: { backgroundColor: '#2563eb' },
    stepLabels: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 72,
        marginBottom: 24,
    },
    stepLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

    // Card
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 20,
    },

    // Name row
    nameRow: { flexDirection: 'row' },

    // Field
    fieldContainer: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
    fieldWrapper: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fieldFocused: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    fieldError: { borderColor: '#ef4444' },
    fieldInput: { flex: 1, fontSize: 15, color: '#1e293b' },
    fieldErrorText: { fontSize: 11, color: '#ef4444', marginTop: 4, marginLeft: 2 },

    // Spec picker
    specPickerText: { fontSize: 15, color: '#1e293b', flex: 1 },
    specDropdown: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
        marginTop: -12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    specOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    specOptionActive: { backgroundColor: '#eff6ff' },
    specOptionText: { fontSize: 14, color: '#334155' },
    specOptionTextActive: { color: '#2563eb', fontWeight: '600' },

    // Disclaimer
    disclaimer: {
        backgroundColor: '#fefce8',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    disclaimerText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

    // Buttons
    buttonRow: { flexDirection: 'row', alignItems: 'center' },
    primaryBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnDisabled: { opacity: 0.65 },
    secondaryBtn: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        paddingVertical: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    secondaryBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },

    // Login link
    loginLink: { alignItems: 'center', paddingVertical: 8 },
    loginLinkText: { fontSize: 14, color: '#64748b' },
    loginLinkBold: { color: '#2563eb', fontWeight: '700' },
});
