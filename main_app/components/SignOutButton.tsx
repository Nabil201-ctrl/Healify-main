import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import tw from 'twrnc';

interface SignOutButtonProps {
    isDark?: boolean;
}

export function SignOutButton({ isDark = false }: SignOutButtonProps) {
    const { signOut } = useAuthContext();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    // The root layout will handle navigation after signOut updates the context.
                    onPress: () => signOut(),
                },
            ]
        );
    };

    return (
        <TouchableOpacity
            style={tw`border-2 ${isDark ? 'border-gray-600' : 'border-gray-300'} py-3 rounded-2xl`}
            onPress={handleSignOut}
            activeOpacity={0.7}
        >
            <Text style={tw`${isDark ? 'text-gray-300' : 'text-gray-600'} text-center text-base font-medium`}>
                🚪 Sign Out
            </Text>
        </TouchableOpacity>
    );
}
