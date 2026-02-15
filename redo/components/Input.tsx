import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface InputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    label?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const Input = ({ placeholder, value, onChangeText, secureTextEntry, label, autoCapitalize = 'none' }: InputProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault, backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f0f0f0' }]}
                placeholder={placeholder}
                placeholderTextColor={colors.tabIconDefault}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        width: '100%',
    },
    label: {
        marginBottom: 5,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        fontSize: 16,
    },
});
