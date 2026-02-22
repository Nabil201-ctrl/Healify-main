import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

import { ViewStyle, StyleProp } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: StyleProp<ViewStyle>;
}

export const Button = ({ title, onPress, isLoading, variant = 'primary', style }: ButtonProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const getBackgroundColor = () => {
        if (variant === 'primary') return colors.tint;
        if (variant === 'secondary') return colors.tabIconDefault;
        return 'transparent';
    };

    const getTextColor = () => {
        if (variant === 'outline') return colors.tint;
        return '#fff';
    };

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: getBackgroundColor(), borderColor: colors.tint, borderWidth: variant === 'outline' ? 1 : 0 }, style]}
            onPress={onPress}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        width: '100%',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
