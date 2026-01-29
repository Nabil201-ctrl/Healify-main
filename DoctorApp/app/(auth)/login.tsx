import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/DoctorAuthContext';
import tw from 'twrnc';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 justify-center items-center bg-white p-6`}>
            <View style={tw`w-full max-w-sm`}>
                <Text style={tw`text-3xl font-bold text-center mb-2 text-blue-600`}>Healify</Text>
                <Text style={tw`text-xl font-semibold text-center mb-8 text-gray-600`}>Doctor Portal</Text>

                <View style={tw`mb-4`}>
                    <Text style={tw`text-gray-700 mb-2 font-medium`}>Email</Text>
                    <TextInput
                        style={tw`w-full border border-gray-300 rounded-lg p-3 bg-gray-50`}
                        placeholder="doctor@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={tw`mb-6`}>
                    <Text style={tw`text-gray-700 mb-2 font-medium`}>Password</Text>
                    <TextInput
                        style={tw`w-full border border-gray-300 rounded-lg p-3 bg-gray-50`}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={tw`w-full bg-blue-600 p-4 rounded-lg items-center ${loading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={tw`text-white font-bold text-lg`}>Login</Text>
                    )}
                </TouchableOpacity>

                <View style={tw`mt-6 p-4 bg-blue-50 rounded-lg`}>
                    <Text style={tw`text-xs text-blue-800 text-center`}>
                        Authorized medical personnel only. All access is logged and monitored.
                    </Text>
                </View>
            </View>
        </View>
    );
}
