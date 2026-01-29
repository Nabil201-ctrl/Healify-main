import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import tw from 'twrnc';

export default function SignUpScreen() {
    const { signUp } = useAuthContext();
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);

    const onSignUpPress = async () => {
        if (!emailAddress || !password || !firstName) {
            Alert.alert('Error', 'Please fill out all required fields.');
            return;
        }
        setLoading(true);
        try {
            console.log('[SignUp] Attempting sign up for:', emailAddress);
            await signUp({
                email: emailAddress,
                firstName: firstName,
                lastName: lastName,
                password: password,
            });
            console.log('[SignUp] Sign up successful');
            // On success, the root layout will handle navigation.
        } catch (err: any) {
            console.error('[SignUp] Error:', err);
            let errorMessage = 'An error occurred during sign up';
            
            // Handle specific error cases
            if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
            // Handle duplicate email specifically
            if (errorMessage.includes('already registered') || errorMessage.includes('duplicate')) {
                errorMessage = 'This email is already registered. Please sign in or use a different email.';
            }
            
            Alert.alert('Sign Up Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-white px-6 justify-center`}>
            <View style={tw`items-center mb-10`}>
                <Text style={tw`text-3xl font-bold text-green-700 mb-2`}>Create Your Account</Text>
                <Text style={tw`text-gray-500 text-center`}>Join Healthify today.</Text>
            </View>

            <Text style={tw`text-gray-600 mb-2`}>First Name</Text>
            <TextInput
                style={tw`border border-gray-300 rounded-xl p-3 mb-4`}
                placeholder="Your first name"
                value={firstName}
                onChangeText={setFirstName}
            />

            <Text style={tw`text-gray-600 mb-2`}>Last Name (Optional)</Text>
            <TextInput
                style={tw`border border-gray-300 rounded-xl p-3 mb-4`}
                placeholder="Your last name"
                value={lastName}
                onChangeText={setLastName}
            />

            <Text style={tw`text-gray-600 mb-2`}>Email Address</Text>
            <TextInput
                style={tw`border border-gray-300 rounded-xl p-3 mb-4`}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={emailAddress}
                onChangeText={setEmailAddress}
            />

            <Text style={tw`text-gray-600 mb-2`}>Password</Text>
            <TextInput
                style={tw`border border-gray-300 rounded-xl p-3 mb-6`}
                placeholder="Create a strong password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                onPress={onSignUpPress}
                disabled={loading}
                style={tw`bg-green-600 py-4 rounded-xl ${loading ? 'opacity-50' : ''}`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={tw`text-center text-white text-lg font-semibold`}>Create Account</Text>
                )}
            </TouchableOpacity>

            <View style={tw`flex-row justify-center mt-5`}>
                <Text style={tw`text-gray-600`}>Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                    <TouchableOpacity>
                        <Text style={tw`text-green-700 font-semibold ml-1`}>Sign In</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
