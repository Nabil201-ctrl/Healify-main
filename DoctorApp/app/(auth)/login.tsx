import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/DoctorAuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    <Text style={styles.subtitle}>Doctor Portal</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>
                    <Text style={styles.cardSubtitle}>Sign in to your doctor account</Text>

                    {/* Email */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Email Address</Text>
                        <View style={[styles.fieldWrapper, emailFocused && styles.fieldFocused]}>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="doctor@hospital.com"
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Password</Text>
                        <View style={[styles.fieldWrapper, passFocused && styles.fieldFocused]}>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                onFocus={() => setPassFocused(true)}
                                onBlur={() => setPassFocused(false)}
                                onSubmitEditing={handleLogin}
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Disclaimer */}
                    <View style={styles.disclaimer}>
                        <Text style={styles.disclaimerText}>
                            🔒 Authorized medical personnel only. All access is logged and monitored.
                        </Text>
                    </View>
                </View>

                {/* Register link */}
                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => router.push('/(auth)/register')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.registerLinkText}>
                        New to Healify?{' '}
                        <Text style={styles.registerLinkBold}>Create Doctor Account</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 72, flexGrow: 1, justifyContent: 'center' },

    header: { alignItems: 'center', marginBottom: 36 },
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
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },

    fieldContainer: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
    fieldWrapper: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    fieldFocused: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    fieldInput: { fontSize: 15, color: '#1e293b' },

    primaryBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnDisabled: { opacity: 0.65 },

    disclaimer: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    disclaimerText: { fontSize: 11.5, color: '#075985', lineHeight: 17, textAlign: 'center' },

    registerLink: { alignItems: 'center', paddingVertical: 10 },
    registerLinkText: { fontSize: 14, color: '#64748b' },
    registerLinkBold: { color: '#2563eb', fontWeight: '700' },
});
