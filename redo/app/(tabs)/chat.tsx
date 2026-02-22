import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, StyleSheet, StatusBar,
    Keyboard, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

type Message = {
    id: string;
    author: 'me' | 'ai';
    text: string;
    timestamp: number;
};

// ─── Chat Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Stable session ID ref — does NOT trigger re-renders
    const sessionIdRef = useRef<string | null>(null);

    // Guard: prevents calling sendMessage while already sending
    const isSendingRef = useRef(false);

    // Cleanup ref for the poll interval so we can cancel it on unmount / new message
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const flatListRef = useRef<FlatList>(null);

    // ── Poll for AI response ──────────────────────────────────────────────────

    const startPolling = useCallback((sessionId: string) => {
        // Cancel any pre-existing poll
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        setIsTyping(true);
        let polls = 0;
        const MAX_POLLS = 30; // 30s timeout

        pollIntervalRef.current = setInterval(async () => {
            polls++;
            try {
                const res = await api.get(`/chat/session/${sessionId}`);
                const session = res.data?.session;

                if (session?.status === 'completed' && session?.response) {
                    clearInterval(pollIntervalRef.current!);
                    pollIntervalRef.current = null;
                    setIsTyping(false);
                    isSendingRef.current = false;

                    setMessages(prev => [
                        ...prev,
                        {
                            id: `ai-${Date.now()}`,
                            author: 'ai',
                            text: session.response,
                            timestamp: Date.now(),
                        },
                    ]);
                    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                }
            } catch {
                // silent — keep polling
            }

            if (polls >= MAX_POLLS) {
                clearInterval(pollIntervalRef.current!);
                pollIntervalRef.current = null;
                setIsTyping(false);
                isSendingRef.current = false;

                setMessages(prev => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        author: 'ai',
                        text: 'Sorry, the response took too long. Please try again.',
                        timestamp: Date.now(),
                    },
                ]);
            }
        }, 1000);
    }, []);

    // ── Send a message ────────────────────────────────────────────────────────

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isSendingRef.current) return;

        isSendingRef.current = true;
        setInput('');
        Keyboard.dismiss();

        // Append user message immediately
        const userMsg: Message = {
            id: `me-${Date.now()}`,
            author: 'me',
            text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const res = await api.post('/chat/send', {
                message: text,
                // Reuse existing session or leave undefined to start new one
                sessionId: sessionIdRef.current ?? undefined,
            });

            const data = res.data;

            if (data?.success) {
                // Persist the session ID for the lifetime of this conversation
                if (data.sessionId) {
                    sessionIdRef.current = data.sessionId;
                }

                const sid = data.sessionId ?? sessionIdRef.current;
                if (sid) {
                    startPolling(sid);
                } else {
                    isSendingRef.current = false;
                }
            } else {
                throw new Error('Server returned success: false');
            }
        } catch (error: any) {
            console.warn('[Chat] Send failed:', error?.message);
            isSendingRef.current = false;
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    author: 'ai',
                    text: 'Could not reach the server. Please try again.',
                    timestamp: Date.now(),
                },
            ]);
        }
    }, [input, startPolling]);

    // ── New conversation ──────────────────────────────────────────────────────

    const startNewChat = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        isSendingRef.current = false;
        sessionIdRef.current = null;
        setMessages([]);
        setIsTyping(false);
        setInput('');
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────

    const renderItem = useCallback(({ item }: { item: Message }) => {
        const isMe = item.author === 'me';
        return (
            <View style={[styles.messageRow, { flexDirection: isMe ? 'row-reverse' : 'row' }]}>
                {!isMe && (
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }]}>
                        <Text style={styles.avatarText}>🤖</Text>
                    </View>
                )}
                <View style={[
                    styles.bubble,
                    isMe
                        ? { backgroundColor: colors.tint, borderBottomRightRadius: 4 }
                        : { backgroundColor: isDark ? '#1e293b' : '#f3f4f6', borderBottomLeftRadius: 4 },
                ]}>
                    <Text style={[styles.messageText, { color: isMe ? 'white' : colors.text }]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    }, [isDark, colors]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9', backgroundColor: colors.background }]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.aiDot, { backgroundColor: '#10b981' }]} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Healify AI</Text>
                </View>
                <TouchableOpacity onPress={startNewChat} style={[styles.newChatButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Ionicons name="create-outline" size={20} color={colors.tint} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 130 }]}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                                    <Text style={styles.emptyEmoji}>🤖</Text>
                                </View>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>Ask Healify AI</Text>
                                <Text style={[styles.emptySubtitle, { color: isDark ? '#6b7280' : '#94a3b8' }]}>
                                    Get instant answers about your health, medications, symptoms, and more.
                                </Text>
                                <View style={styles.suggestionsRow}>
                                    {[
                                        'What are my health risks?',
                                        'How can I sleep better?',
                                        'Explain my heart rate data',
                                    ].map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            onPress={() => { setInput(s); }}
                                            style={[styles.suggestion, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                                        >
                                            <Text style={[styles.suggestionText, { color: colors.tint }]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        }
                        ListFooterComponent={isTyping ? (
                            <View style={styles.typingRow}>
                                <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }]}>
                                    <Text style={styles.avatarText}>🤖</Text>
                                </View>
                                <View style={[styles.typingBubble, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }]}>
                                    <ActivityIndicator size="small" color={colors.tint} />
                                    <Text style={[styles.typingText, { color: isDark ? '#6b7280' : '#94a3b8' }]}>Thinking…</Text>
                                </View>
                            </View>
                        ) : null}
                    />
                </View>
            </TouchableWithoutFeedback>

            {/* Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 65 : 0}
                style={styles.keyboardAvoidingView}
            >
                <View style={[styles.inputContainer, { marginBottom: Platform.OS === 'ios' ? 65 : 75 }]}>
                    <View style={[styles.inputWrapper, {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 4,
                    }]}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Message Healify AI…"
                            placeholderTextColor={isDark ? '#4b5563' : '#9ca3af'}
                            style={[styles.input, { color: colors.text }]}
                            multiline
                            onSubmitEditing={sendMessage}
                            blurOnSubmit={false}
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={!input.trim() || isSendingRef.current}
                            style={[
                                styles.sendButton,
                                { backgroundColor: input.trim() && !isTyping ? colors.tint : (isDark ? '#374151' : '#e5e7eb') },
                            ]}
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={input.trim() && !isTyping ? 'white' : (isDark ? '#6b7280' : '#9ca3af')}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.disclaimer, { color: isDark ? '#374151' : '#d1d5db' }]}>
                        For informational purposes only. Consult a doctor for medical advice.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    newChatButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    listContent: { padding: 20 },

    emptyContainer: {
        alignItems: 'center',
        paddingTop: 48,
        paddingHorizontal: 32,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyEmoji: { fontSize: 40 },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: 'BricolageGrotesque',
        marginBottom: 24,
    },
    suggestionsRow: {
        width: '100%',
        gap: 8,
    },
    suggestion: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    suggestionText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
        textAlign: 'center',
    },

    messageRow: {
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    typingRow: {
        flexDirection: 'row',
        marginBottom: 16,
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
    avatarText: { fontSize: 20 },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'BricolageGrotesque',
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        gap: 8,
    },
    typingText: {
        fontSize: 13,
        fontFamily: 'BricolageGrotesque',
    },

    keyboardAvoidingView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        alignItems: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        paddingLeft: 16,
        borderRadius: 28,
        borderWidth: 1.5,
        width: '100%',
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        fontFamily: 'BricolageGrotesque',
        paddingRight: 10,
        paddingVertical: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    disclaimer: {
        fontSize: 10,
        marginTop: 6,
        fontFamily: 'BricolageGrotesque',
        textAlign: 'center',
    },
});
