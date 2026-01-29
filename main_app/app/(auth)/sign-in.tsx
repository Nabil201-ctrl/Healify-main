import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import tw from 'twrnc';

export default function SignInScreen() {
    const { signIn } = useAuthContext();
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState(''); // Password is not used in mock, but required for UI
    const [loading, setLoading] = useState(false);

    const onSignInPress = async () => {
        if (!emailAddress || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        try {
            console.log('[SignIn] Attempting sign in for:', emailAddress);
            await signIn(emailAddress, password);
            console.log('[SignIn] Sign in successful');
            // On success, the root layout will handle navigation.
        } catch (err: any) {
            console.error('[SignIn] Error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred during sign in';
            Alert.alert('Sign In Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-white px-6 justify-center`}>
            <View style={tw`items-center mb-10`}>
                <Text style={tw`text-3xl font-bold text-green-700 mb-2`}>Sign In to Healthify</Text>
                <Text style={tw`text-gray-500 text-center`}>Welcome back!</Text>
            </View>

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
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                onPress={onSignInPress}
                disabled={loading}
                style={tw`bg-green-600 py-4 rounded-xl ${loading ? 'opacity-50' : ''}`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={tw`text-center text-white text-lg font-semibold`}>Sign In</Text>
                )}
            </TouchableOpacity>

            <View style={tw`flex-row justify-center mt-5`}>
                <Text style={tw`text-gray-600`}>Don't have an account?</Text>
                <Link href="/(auth)/sign-up" asChild>
                    <TouchableOpacity>
                        <Text style={tw`text-green-700 font-semibold ml-1`}>Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}