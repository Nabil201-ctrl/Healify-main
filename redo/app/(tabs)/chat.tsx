import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, StatusBar, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Message = {
    id: string;
    author: 'me' | 'other' | 'doctor';
    text: string;
    timestamp: number;
};

export default function ChatScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            author: 'me',
            text: input.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Simulate response
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                author: 'other',
                text: "I'm a placeholder bot. The full chat functionality is coming soon!",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, reply]);
        }, 1000);
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.author === 'me';
        return (
            <View style={[styles.messageRow, { flexDirection: isMe ? 'row-reverse' : 'row' }]}>
                {!isMe && (
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#374151' : '#e0f2fe' }]}>
                        <Text style={styles.avatarText}>🤖</Text>
                    </View>
                )}
                <View style={[
                    styles.bubble,
                    isMe ? { backgroundColor: colors.tint, borderBottomRightRadius: 4 } : { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderBottomLeftRadius: 4 },
                ]}>
                    <Text style={[styles.messageText, { color: isMe ? 'white' : colors.text }]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: colors.background }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Healify Chat</Text>
                <TouchableOpacity style={styles.newChatButton}>
                    <Ionicons name="create-outline" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // Add padding for floating input
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />
                </View>
            </TouchableWithoutFeedback>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.keyboardAvoidingView}
            >
                <View style={[styles.inputContainer, { marginBottom: Platform.OS === 'ios' ? 10 : 20 }]}>
                    <View style={[styles.inputWrapper, {
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                    }]}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Message Healify..."
                            placeholderTextColor="#9ca3af"
                            style={[styles.input, { color: colors.text }]}
                            multiline
                        />
                        <TouchableOpacity onPress={sendMessage} disabled={!input.trim()} style={[styles.sendButton, { backgroundColor: input.trim() ? colors.tint : (isDark ? '#374151' : '#e5e7eb') }]}>
                            <Ionicons name="arrow-up" size={20} color={input.trim() ? 'white' : '#9ca3af'} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.disclaimer}>AI advice. Consult a doctor.</Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    newChatButton: {
        position: 'absolute',
        right: 20,
        bottom: 14,
    },
    listContent: {
        padding: 20,
    },
    messageRow: {
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 20,
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'BricolageGrotesque',
    },
    keyboardAvoidingView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        paddingLeft: 20,
        borderRadius: 30,
        borderWidth: 1,
        width: '100%',
        maxWidth: 600,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        fontFamily: 'BricolageGrotesque',
        paddingRight: 10,
        paddingVertical: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disclaimer: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 8,
        fontFamily: 'BricolageGrotesque',
    },
});
