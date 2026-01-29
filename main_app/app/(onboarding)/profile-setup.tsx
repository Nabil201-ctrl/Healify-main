import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { LinearGradient } from 'expo-linear-gradient';

type BodyType = 'Slim' | 'Lean' | 'Fat' | 'Average';
type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';
type JobType = 'Active' | 'Office' | 'Mixed';
type LocationOption = { id: string; city: string; state?: string; country: string };

export default function ProfileSetupScreen() {
    const router = useRouter();
    const { user, signIn, reloadUser } = useAuthContext();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bodyType, setBodyType] = useState<BodyType | ''>('');

    const [location, setLocation] = useState('');
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const [jobType, setJobType] = useState<JobType | ''>('');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
    const [averageSteps, setAverageSteps] = useState('');
    const [daysLessActive, setDaysLessActive] = useState<string[]>([]);

    const [healthIssues, setHealthIssues] = useState('');
    const [allergies, setAllergies] = useState('');
    const [medications, setMedications] = useState('');

    const totalSteps = 3;

    useEffect(() => {
        const fetchLocations = async () => {
            setLoadingLocations(true);
            try {
                const { data } = await api.get('/users/locations');
                setLocations(data.locations || []);
            } catch (err) {
                console.warn('Failed to load locations, using fallback list');
                setLocations([
                    { id: 'nyc', city: 'New York', state: 'NY', country: 'USA' },
                    { id: 'sf', city: 'San Francisco', state: 'CA', country: 'USA' },
                    { id: 'ldn', city: 'London', state: 'London', country: 'UK' },
                ]);
            } finally {
                setLoadingLocations(false);
            }
        };

        fetchLocations();
    }, []);

    const handleNext = () => {
        if (step === 1) {
            if (!age || !height || !weight || !bodyType || !location) {
                const missing = [];
                if (!age) missing.push('Age');
                if (!height) missing.push('Height');
                if (!weight) missing.push('Weight');
                if (!bodyType) missing.push('Body Type');
                if (!location) missing.push('Location');
                Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
                return;
            }
        } else if (step === 2) {
            console.log('Step 2 Validation:', { jobType, activityLevel, averageSteps });
            if (!jobType || !activityLevel || !averageSteps) {
                const missing = [];
                if (!jobType) missing.push('Job Type');
                if (!activityLevel) missing.push('Activity Level');
                if (!averageSteps) missing.push('Average Steps');
                Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
                return;
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                age: Number(age),
                height: Number(height),
                weight: Number(weight),
                bodyType,
                jobType,
                activityLevel,
                averageSteps: Number(averageSteps),
                daysLessActive,
                healthIssues: healthIssues.split(',').map(s => s.trim()).filter(Boolean),
                allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
                medications: medications.split(',').map(s => s.trim()).filter(Boolean),
                location,
                isProfileComplete: true,
                onboardingStatus: 'COMPLETED'
            };

            await api.patch('/users/me', payload);
            await reloadUser();

            // Success alert handled by user noticing navigation or we can show one
            // Ideally we just navigate, the RootLayout will see the new user state and redirect.
            // But let's add a small delay/alert for UX
            Alert.alert('All Set!', 'Your profile has been created successfully.', [
                { text: 'Let\'s Go', onPress: () => { } } // Navigation happens via reactive state
            ]);

        } catch (error) {
            console.error('Profile update error:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: string) => {
        if (daysLessActive.includes(day)) {
            setDaysLessActive(daysLessActive.filter(d => d !== day));
        } else {
            setDaysLessActive([...daysLessActive, day]);
        }
    };

    // UI Components
    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <Text style={tw`text-2xl font-bold text-slate-800 mb-6`}>{children}</Text>
    );

    const Label = ({ children }: { children: React.ReactNode }) => (
        <Text style={tw`text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide`}>{children}</Text>
    );

    const Input = (props: React.ComponentProps<typeof TextInput>) => (
        <TextInput
            style={tw`border border-slate-200 bg-slate-50 rounded-2xl p-4 mb-6 text-slate-800 text-base`}
            placeholderTextColor="#94a3b8"
            {...props}
        />
    );

    const Chip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[
                tw`px-5 py-3 rounded-xl border mb-2 mr-2`,
                selected
                    ? tw`bg-green-600 border-green-600 shadow-sm`
                    : tw`bg-white border-slate-200`
            ]}
        >
            <Text style={[
                tw`font-medium`,
                selected ? tw`text-white` : tw`text-slate-600`
            ]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderStep1 = () => (
        <View>
            <SectionTitle>Basics</SectionTitle>

            <Label>Age</Label>
            <Input keyboardType="numeric" value={age} onChangeText={setAge} placeholder="e.g. 25" />

            <View style={tw`flex-row gap-4`}>
                <View style={tw`flex-1`}>
                    <Label>Height (cm)</Label>
                    <Input keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 175" />
                </View>
                <View style={tw`flex-1`}>
                    <Label>Weight (kg)</Label>
                    <Input keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="e.g. 70" />
                </View>
            </View>

            <Label>Location</Label>
            {loadingLocations ? (
                <ActivityIndicator style={tw`self-start mb-6`} color="#16a34a" />
            ) : (
                <View style={tw`flex-row flex-wrap mb-6`}>
                    {locations.map((loc) => {
                        const label = `${loc.city}${loc.state ? ', ' + loc.state : ''}`;
                        const fullLabel = `${label}, ${loc.country}`;
                        return (
                            <Chip
                                key={loc.id}
                                label={fullLabel}
                                selected={location === fullLabel}
                                onPress={() => setLocation(fullLabel)}
                            />
                        );
                    })}
                </View>
            )}

            <Label>Body Type</Label>
            <View style={tw`flex-row flex-wrap mb-4`}>
                {['Slim', 'Lean', 'Fat', 'Average'].map((type) => (
                    <Chip
                        key={type}
                        label={type}
                        selected={bodyType === type}
                        onPress={() => setBodyType(type as BodyType)}
                    />
                ))}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <SectionTitle>Lifestyle</SectionTitle>

            <Label>Job Type</Label>
            <View style={tw`flex-row flex-wrap mb-6`}>
                {['Active', 'Office', 'Mixed'].map((type) => (
                    <Chip
                        key={type}
                        label={type}
                        selected={jobType === type}
                        onPress={() => setJobType(type as JobType)}
                    />
                ))}
            </View>

            <Label>Activity Level</Label>
            <View style={tw`flex-row flex-wrap mb-6`}>
                {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map((level) => (
                    <Chip
                        key={level}
                        label={level}
                        selected={activityLevel === level}
                        onPress={() => setActivityLevel(level as ActivityLevel)}
                    />
                ))}
            </View>

            <Label>Daily Steps (Avg)</Label>
            <Input keyboardType="numeric" value={averageSteps} onChangeText={setAverageSteps} placeholder="e.g. 5000" />

            <Label>Days Less Active</Label>
            <View style={tw`flex-row flex-wrap mb-4`}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <Chip
                        key={day}
                        label={day}
                        selected={daysLessActive.includes(day)}
                        onPress={() => toggleDay(day)}
                    />
                ))}
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View>
            <SectionTitle>Health Profile</SectionTitle>
            <Text style={tw`text-slate-500 mb-6`}>Optional but helps us personalize your experience.</Text>

            <Label>Health Issues</Label>
            <Input
                value={healthIssues}
                onChangeText={setHealthIssues}
                placeholder="e.g. Asthma, Diabetes"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
            />

            <Label>Allergies</Label>
            <Input
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g. Peanuts, Penicillin"
                multiline
            />

            <Label>Current Medications</Label>
            <Input
                value={medications}
                onChangeText={setMedications}
                placeholder="e.g. Ibuprofen"
                multiline
            />
        </View>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-white`}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                {/* Header */}
                <View style={tw`px-6 pt-4 pb-2 border-b border-slate-100`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <TouchableOpacity onPress={handleBack} disabled={step === 1} style={{ opacity: step === 1 ? 0 : 1 }}>
                            <Ionicons name="arrow-back" size={24} color="#334155" />
                        </TouchableOpacity>
                        <Text style={tw`font-semibold text-slate-800`}>Step {step} of {totalSteps}</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    {/* Progress Bar */}
                    <View style={tw`h-1.5 bg-slate-100 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-green-600 rounded-full`, { width: `${(step / totalSteps) * 100}%` }]} />
                    </View>
                </View>

                <ScrollView
                    style={tw`flex-1 px-6`}
                    contentContainerStyle={tw`py-8`}
                    showsVerticalScrollIndicator={false}
                >
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </ScrollView>

                {/* Footer Buttons */}
                <View style={tw`p-6 border-t border-slate-100 bg-white`}>
                    <TouchableOpacity
                        onPress={step === totalSteps ? handleSubmit : handleNext}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#16a34a', '#15803d']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={tw`py-4 rounded-2xl shadow-lg items-center justify-center`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={tw`text-white text-lg font-bold`}>
                                    {step === totalSteps ? 'Complete Profile' : 'Next Step'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
