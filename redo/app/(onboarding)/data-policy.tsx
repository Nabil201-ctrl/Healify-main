import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserService } from '@/services/UserService';

export default function DataPolicyScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const proceed = () => {
        router.replace('/(tabs)');
    };

    const handleAllowConnect = async () => {
        try {
            await UserService.setHealthSync(true);
            Alert.alert('Health Connect', 'Google Fit connection simulation successful.', [
                { text: 'OK', onPress: proceed }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Could not save sync preference, but proceeding...');
            proceed();
        }
    };

    const handleSkip = async () => {
        try {
            await UserService.setHealthSync(false);
            proceed();
        } catch (error) {
            proceed();
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={[styles.skipText, { color: colors.tabIconDefault }]}>Skip for now</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: `${colors.tint}15` }]}>
                        <Ionicons name="shield-checkmark" size={48} color={colors.tint} />
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Data Privacy & Health Connect</Text>
                <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
                    To provide you with personalized AI health insights and accurate medical tracking, Healify needs to securely access your wellness data.
                </Text>

                <View style={styles.card}>
                    <View style={styles.featureRow}>
                        <Ionicons name="fitness" size={24} color="#10b981" style={styles.featureIcon} />
                        <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>What we collect</Text>
                            <Text style={[styles.featureDescription, { color: colors.tabIconDefault }]}>
                                We sync daily steps, sleep duration, exercise minutes, and vital metrics directly from Google Fit / Health Connect.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureRow}>
                        <Ionicons name="analytics" size={24} color="#3b82f6" style={styles.featureIcon} />
                        <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>How it's used</Text>
                            <Text style={[styles.featureDescription, { color: colors.tabIconDefault }]}>
                                Our AI uses this data to give proactive health advice. Your certified doctors can also review this history during live consultations.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureRow}>
                        <Ionicons name="lock-closed" size={24} color="#8b5cf6" style={styles.featureIcon} />
                        <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>We never sell your data</Text>
                            <Text style={[styles.featureDescription, { color: colors.tabIconDefault }]}>
                                Your medical data is strictly confidential, encrypted, and governed by HIPAA-compliant security standards.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: isDark ? '#333' : '#eee' }]}>
                <Button
                    title="Allow Health Connection"
                    onPress={handleAllowConnect}
                    style={{ backgroundColor: colors.tint, marginBottom: 12 }}
                />
                <Button
                    title="Continue without Connecting"
                    onPress={handleSkip}
                    style={{ backgroundColor: isDark ? '#333' : '#e5e5e5' }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    skipButton: {
        paddingVertical: 8,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    card: {
        gap: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    featureIcon: {
        marginTop: 2,
        marginRight: 16,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        padding: 24,
        paddingBottom: 34,
        borderTopWidth: 1,
    },
});
