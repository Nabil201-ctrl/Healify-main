import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, StyleSheet, StatusBar,
    Keyboard, TouchableWithoutFeedback, ActivityIndicator,
    ScrollView, Animated, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
    ChatSessionService,
    ChatSession,
    ChatMessage,
    AvailableDoctor,
} from '@/services/ChatSessionService';
import { UserService } from '@/services/UserService';

// ─── Chat Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    // ── Session Management ────────────────────────────────────────────────────
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarAnim = useRef(new Animated.Value(-300)).current;

    // ── Message / Input State ────────────────────────────────────────────────
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const isSendingRef = useRef(false);
    const flatListRef = useRef<FlatList>(null);

    // ── Doctor Session Polling ────────────────────────────────────────────────
    const doctorPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [doctorWaitingModal, setDoctorWaitingModal] = useState(false);
    const dotAnim = useRef(new Animated.Value(0)).current;

    // ── Doctor Picker ────────────────────────────────────────────────────────
    const [docPickerVisible, setDocPickerVisible] = useState(false);
    const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);

    // ─── Load sessions on mount / focus ───────────────────────────────────────

    useFocusEffect(
        useCallback(() => {
            loadSessions();
        }, [])
    );

    const loadSessions = async () => {
        const allSessions = await ChatSessionService.loadSessions();
        setSessions(allSessions);

        const activeId = await ChatSessionService.getActiveSessionId();
        if (activeId) {
            const found = allSessions.find(s => s.localId === activeId);
            if (found) { setActiveSession(found); return; }
        }

        // If no active session, create a fresh AI one
        if (allSessions.length === 0) {
            await createNewAISession(allSessions);
        } else {
            const latest = allSessions[allSessions.length - 1];
            setActiveSession(latest);
            await ChatSessionService.setActiveSessionId(latest.localId);
        }
    };

    // ─── Create new AI session ────────────────────────────────────────────────

    const createNewAISession = async (existingSessions?: ChatSession[]) => {
        const newSession = ChatSessionService.createAISession();
        const list = existingSessions ?? sessions;
        const updated = [...list, newSession];
        await ChatSessionService.saveSessions(updated);
        await ChatSessionService.setActiveSessionId(newSession.localId);
        setSessions(updated);
        setActiveSession(newSession);
        setInput('');
        closeSidebar();
    };

    // ─── Switch session ───────────────────────────────────────────────────────

    const switchSession = async (session: ChatSession) => {
        stopDoctorPoll();
        await ChatSessionService.setActiveSessionId(session.localId);
        setActiveSession(session);
        setInput('');
        closeSidebar();

        // Resume doctor polling if the session is a live doctor session
        if (session.type === 'doctor' && session.serverSessionId && session.doctorStatus !== 'ended') {
            startDoctorPoll(session.serverSessionId, session.localId);
        }
    };

    // ─── Delete session ───────────────────────────────────────────────────────

    const deleteSession = async (localId: string) => {
        const updated = sessions.filter(s => s.localId !== localId);
        await ChatSessionService.saveSessions(updated);
        setSessions(updated);

        if (activeSession?.localId === localId) {
            if (updated.length > 0) {
                const next = updated[updated.length - 1];
                setActiveSession(next);
                await ChatSessionService.setActiveSessionId(next.localId);
            } else {
                await createNewAISession([]);
            }
        }
    };

    // ─── Update active session helper ─────────────────────────────────────────

    const updateActiveSession = async (updater: (s: ChatSession) => ChatSession) => {
        if (!activeSession) return;
        const updated = updater(activeSession);
        const newSessions = await ChatSessionService.updateSession(sessions, updated);
        setSessions(newSessions);
        setActiveSession(updated);
    };

    // ── Sidebar ───────────────────────────────────────────────────────────────

    const openSidebar = () => {
        setSidebarOpen(true);
        Animated.spring(sidebarAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    };

    const closeSidebar = () => {
        Animated.timing(sidebarAnim, {
            toValue: -300,
            duration: 220,
            useNativeDriver: true,
        }).start(() => setSidebarOpen(false));
    };

    // ── Send AI Message ───────────────────────────────────────────────────────

    const sendAIMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isSendingRef.current || !activeSession) return;

        isSendingRef.current = true;
        setInput('');
        Keyboard.dismiss();

        const userMsg: ChatMessage = {
            id: `me-${Date.now()}`,
            author: 'me',
            text,
            timestamp: Date.now(),
        };

        const withUser = ChatSessionService.autoTitle({
            ...activeSession,
            messages: [...activeSession.messages, userMsg],
        });
        const afterUser = await ChatSessionService.updateSession(sessions, withUser);
        setSessions(afterUser);
        setActiveSession(withUser);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        setIsTyping(true);

        try {
            const result = await ChatSessionService.sendAIMessage(activeSession.serverSessionId, text);

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                author: 'ai',
                text: result.response,
                timestamp: Date.now(),
            };

            await updateActiveSession(s => ({
                ...s,
                serverSessionId: result.sessionId,
                messages: [...withUser.messages, aiMsg],
            }));
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error: any) {
            const errMsg: ChatMessage = {
                id: `err-${Date.now()}`,
                author: 'ai',
                text: 'Could not reach the server. Please try again.',
                timestamp: Date.now(),
            };
            await updateActiveSession(s => ({
                ...s,
                messages: [...withUser.messages, errMsg],
            }));
        } finally {
            setIsTyping(false);
            isSendingRef.current = false;
        }
    }, [input, activeSession, sessions]);

    // ── Send Doctor Message ───────────────────────────────────────────────────

    const sendDoctorMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isSendingRef.current || !activeSession || !activeSession.serverSessionId) return;

        if (activeSession.doctorStatus === 'waiting') {
            Alert.alert('Still Waiting', 'Please wait for a doctor to connect before sending messages.');
            return;
        }

        isSendingRef.current = true;
        setInput('');
        Keyboard.dismiss();

        const userMsg: ChatMessage = {
            id: `me-${Date.now()}`,
            author: 'me',
            text,
            timestamp: Date.now(),
        };

        await updateActiveSession(s => ({ ...s, messages: [...s.messages, userMsg] }));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            await ChatSessionService.sendDoctorMessage(activeSession.serverSessionId, text);
        } catch (error: any) {
            console.warn('[DoctorChat] Send failed:', error?.message);
        } finally {
            isSendingRef.current = false;
        }
    }, [input, activeSession, sessions]);

    // ── Talk to Doctor — open picker first ───────────────────────────────────

    const openDoctorPicker = async () => {
        closeSidebar();
        setDocPickerVisible(true);
        setDoctorsLoading(true);
        try {
            const doctors = await ChatSessionService.getAvailableDoctors();
            setAvailableDoctors(doctors);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not load doctors. Please try again.');
            setDocPickerVisible(false);
        } finally {
            setDoctorsLoading(false);
        }
    };

    const requestDoctor = async (doctor: AvailableDoctor) => {
        setDocPickerVisible(false);
        try {
            setDoctorWaitingModal(true);
            startDotAnimation();

            // Create local session placeholder
            const newSession = ChatSessionService.createDoctorSession(doctor);
            const updated = [...sessions, newSession];
            await ChatSessionService.saveSessions(updated);
            await ChatSessionService.setActiveSessionId(newSession.localId);
            setSessions(updated);
            setActiveSession(newSession);

            // Hit backend
            const user = await UserService.getProfile();
            const userId = user?.id || 'unknown';
            const result = await ChatSessionService.requestDoctorSession(userId, doctor.doctorId);

            const systemMsg: ChatMessage = {
                id: `sys-${Date.now()}`,
                author: 'ai',
                text: `Your request has been sent to Dr. ${doctor.firstName} ${doctor.lastName}. Waiting for them to connect…`,
                timestamp: Date.now(),
            };

            const updatedSession: ChatSession = {
                ...newSession,
                serverSessionId: result.sessionId,
                doctorStatus: 'waiting',
                requestedDoctor: doctor,
                title: `Dr. ${doctor.lastName}`,
                messages: [systemMsg],
            };

            const nextSessions = await ChatSessionService.updateSession(updated, updatedSession);
            setSessions(nextSessions);
            setActiveSession(updatedSession);

            // Start polling for doctor connection
            startDoctorPoll(result.sessionId, newSession.localId);
        } catch (error: any) {
            setDoctorWaitingModal(false);
            Alert.alert('Error', error.message || 'Could not request a doctor. Please try again.');
        }
    };

    // ── Doctor Polling ────────────────────────────────────────────────────────

    const startDoctorPoll = (serverSessionId: string, localId: string) => {
        stopDoctorPoll();
        doctorPollRef.current = setInterval(async () => {
            try {
                const result = await ChatSessionService.pollDoctorSession(serverSessionId);

                setSessions(prev => {
                    const session = prev.find(s => s.localId === localId);
                    if (!session) return prev;

                    // Merge only messages we don't already have
                    const existingIds = new Set(session.messages.map(m => m.id));
                    const newMessages = result.messages.filter(m => !existingIds.has(m.id));

                    const updated: ChatSession = {
                        ...session,
                        doctorStatus: result.status,
                        doctorName: result.doctorName,
                        messages: [...session.messages, ...newMessages],
                    };

                    // If doctor just connected, dismiss waiting modal
                    if (result.status === 'connected' && session.doctorStatus === 'waiting') {
                        setDoctorWaitingModal(false);
                    }

                    // If session ended, stop polling
                    if (result.status === 'ended') {
                        stopDoctorPoll();
                    }

                    ChatSessionService.updateSession(prev, updated);
                    setActiveSession(s => s?.localId === localId ? updated : s);
                    return prev.map(s => s.localId === localId ? updated : s);
                });
            } catch {
                // silently ignore poll errors
            }
        }, 5000);
    };

    const stopDoctorPoll = () => {
        if (doctorPollRef.current) {
            clearInterval(doctorPollRef.current);
            doctorPollRef.current = null;
        }
    };

    useEffect(() => () => stopDoctorPoll(), []);

    // ── Dot animation for waiting modal ───────────────────────────────────────

    const startDotAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    };

    // ─── Render message item ──────────────────────────────────────────────────

    const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
        const isMe = item.author === 'me';
        const isDoctor = item.author === 'doctor';

        let bubbleColor = isDark ? '#1e293b' : '#f3f4f6';
        let textColor = colors.text;
        let avatarEmoji = '🤖';
        let label: string | null = null;

        if (isMe) {
            bubbleColor = colors.tint;
            textColor = 'white';
        } else if (isDoctor) {
            bubbleColor = isDark ? '#064e3b' : '#d1fae5';
            textColor = isDark ? '#a7f3d0' : '#065f46';
            avatarEmoji = '👨‍⚕️';
            label = item.doctorName ? `Dr. ${item.doctorName}` : 'Doctor';
        }

        return (
            <View style={[styles.messageRow, { flexDirection: isMe ? 'row-reverse' : 'row' }]}>
                {!isMe && (
                    <View style={[styles.avatar, { backgroundColor: isDoctor ? (isDark ? '#065f46' : '#a7f3d0') : (isDark ? '#1e293b' : '#e0f2fe') }]}>
                        <Text style={styles.avatarText}>{avatarEmoji}</Text>
                    </View>
                )}
                <View style={{ maxWidth: '75%' }}>
                    {label && (
                        <Text style={[styles.senderLabel, { color: isDark ? '#6ee7b7' : '#059669' }]}>{label}</Text>
                    )}
                    <View style={[
                        styles.bubble,
                        { backgroundColor: bubbleColor },
                        isMe ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 },
                    ]}>
                        <Text style={[styles.messageText, { color: textColor }]}>{item.text}</Text>
                    </View>
                </View>
            </View>
        );
    }, [isDark, colors]);

    // ─── Sidebar ──────────────────────────────────────────────────────────────

    const renderSidebar = () => (
        <Modal
            visible={sidebarOpen}
            transparent
            animationType="none"
            onRequestClose={closeSidebar}
        >
            <TouchableWithoutFeedback onPress={closeSidebar}>
                <View style={styles.sidebarOverlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[
                            styles.sidebar,
                            {
                                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                borderRightColor: isDark ? '#1e293b' : '#e2e8f0',
                                transform: [{ translateX: sidebarAnim }],
                                paddingTop: insets.top + 10,
                            }
                        ]}>
                            {/* Sidebar Header */}
                            <View style={styles.sidebarHeader}>
                                <Text style={[styles.sidebarTitle, { color: colors.text }]}>Conversations</Text>
                                <TouchableOpacity onPress={closeSidebar}>
                                    <Ionicons name="close" size={22} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* New Chat Button */}
                            <TouchableOpacity
                                style={[styles.newSessionBtn, { backgroundColor: colors.tint }]}
                                onPress={() => createNewAISession()}
                            >
                                <Ionicons name="add" size={18} color="white" />
                                <Text style={styles.newSessionBtnText}>New AI Chat</Text>
                            </TouchableOpacity>

                            {/* Talk to Doctor Button */}
                            <TouchableOpacity
                                style={[styles.doctorSessionBtn, { borderColor: isDark ? '#064e3b' : '#a7f3d0', backgroundColor: isDark ? '#022c22' : '#ecfdf5' }]}
                                onPress={openDoctorPicker}
                            >
                                <Text style={{ fontSize: 16 }}>👨‍⚕️</Text>
                                <Text style={[styles.doctorSessionBtnText, { color: isDark ? '#6ee7b7' : '#059669' }]}>Talk to a Doctor</Text>
                            </TouchableOpacity>

                            {/* Sessions List */}
                            <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
                                {[...sessions].reverse().map(session => {
                                    const isActive = session.localId === activeSession?.localId;
                                    return (
                                        <TouchableOpacity
                                            key={session.localId}
                                            style={[
                                                styles.sessionItem,
                                                isActive && { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }
                                            ]}
                                            onPress={() => switchSession(session)}
                                        >
                                            <View style={styles.sessionItemContent}>
                                                <Text style={[styles.sessionIcon]}>
                                                    {session.type === 'doctor' ? '👨‍⚕️' : '🤖'}
                                                </Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={[styles.sessionTitle, { color: colors.text }]}
                                                        numberOfLines={1}
                                                    >
                                                        {session.title}
                                                    </Text>
                                                    <Text style={[styles.sessionDate, { color: isDark ? '#6b7280' : '#94a3b8' }]}>
                                                        {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        {session.type === 'doctor' && session.doctorStatus === 'waiting' ? ' · Waiting…' : ''}
                                                        {session.type === 'doctor' && session.doctorStatus === 'connected' ? ' · Connected' : ''}
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert('Delete Chat', 'Remove this conversation?', [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Delete', style: 'destructive', onPress: () => deleteSession(session.localId) },
                                                    ]);
                                                }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons name="trash-outline" size={16} color={isDark ? '#4b5563' : '#cbd5e1'} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    // ─── Doctor waiting modal ─────────────────────────────────────────────────

    const renderDoctorWaitingModal = () => (
        <Modal
            visible={doctorWaitingModal}
            transparent
            animationType="fade"
        >
            <View style={styles.waitingOverlay}>
                <View style={[styles.waitingCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>👨‍⚕️</Text>
                    <Text style={[styles.waitingTitle, { color: colors.text }]}>Connecting you to a doctor</Text>
                    <Text style={[styles.waitingSubtitle, { color: isDark ? '#9ca3af' : '#64748b' }]}>
                        Please wait while we find an available doctor for you. This usually takes 1-3 minutes.
                    </Text>
                    <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 24 }} />
                    <TouchableOpacity
                        style={[styles.cancelWaitBtn, { borderColor: isDark ? '#374151' : '#e2e8f0' }]}
                        onPress={() => {
                            setDoctorWaitingModal(false);
                            stopDoctorPoll();
                        }}
                    >
                        <Text style={{ color: isDark ? '#9ca3af' : '#64748b', fontFamily: 'BricolageGrotesque' }}>
                            Keep in background
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ─── Doctor status banner ─────────────────────────────────────────────────

    const renderDoctorBanner = () => {
        if (activeSession?.type !== 'doctor') return null;

        const status = activeSession.doctorStatus;
        if (status === 'waiting') {
            return (
                <View style={[styles.doctorBanner, { backgroundColor: isDark ? '#1c1917' : '#fefce8', borderColor: isDark ? '#78350f' : '#fde68a' }]}>
                    <ActivityIndicator size="small" color="#d97706" style={{ marginRight: 8 }} />
                    <Text style={[styles.doctorBannerText, { color: isDark ? '#fde68a' : '#92400e' }]}>
                        Waiting for a doctor to connect…
                    </Text>
                </View>
            );
        }
        if (status === 'connected') {
            return (
                <View style={[styles.doctorBanner, { backgroundColor: isDark ? '#022c22' : '#ecfdf5', borderColor: isDark ? '#065f46' : '#a7f3d0' }]}>
                    <View style={[styles.greenDot]} />
                    <Text style={[styles.doctorBannerText, { color: isDark ? '#6ee7b7' : '#065f46' }]}>
                        Dr. {activeSession.doctorName || 'Doctor'} is connected
                    </Text>
                </View>
            );
        }
        if (status === 'ended') {
            return (
                <View style={[styles.doctorBanner, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#374151' : '#e2e8f0' }]}>
                    <Ionicons name="checkmark-circle" size={16} color={isDark ? '#9ca3af' : '#64748b'} style={{ marginRight: 6 }} />
                    <Text style={[styles.doctorBannerText, { color: isDark ? '#9ca3af' : '#64748b' }]}>
                        Consultation ended
                    </Text>
                </View>
            );
        }
        return null;
    };

    // ─── Send dispatcher ──────────────────────────────────────────────────────

    const handleSend = () => {
        if (activeSession?.type === 'doctor') {
            sendDoctorMessage();
        } else {
            sendAIMessage();
        }
    };

    // ─── Header info from active session ─────────────────────────────────────

    const headerTitle = activeSession?.type === 'doctor'
        ? (activeSession.doctorName ? `Dr. ${activeSession.doctorName}` : 'Doctor Chat')
        : 'Healify AI';

    const headerDotColor = activeSession?.type === 'doctor'
        ? (activeSession.doctorStatus === 'connected' ? '#10b981' : activeSession.doctorStatus === 'waiting' ? '#f59e0b' : '#6b7280')
        : '#10b981';

    const inputPlaceholder = activeSession?.type === 'doctor'
        ? (activeSession.doctorStatus === 'waiting' ? 'Waiting for doctor…' : 'Message your doctor…')
        : 'Message Healify AI…';

    const canSend = !!input.trim() && !isSendingRef.current && (
        activeSession?.type === 'ai' ||
        (activeSession?.type === 'doctor' && activeSession.doctorStatus === 'connected')
    );

    // ─── Empty state ─────────────────────────────────────────────────────────

    const isDocSession = activeSession?.type === 'doctor';

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={styles.emptyEmoji}>{isDocSession ? '👨‍⚕️' : '🤖'}</Text>
            </View>
            {isDocSession ? (
                <>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Doctor Consultation</Text>
                    <Text style={[styles.emptySubtitle, { color: isDark ? '#6b7280' : '#94a3b8' }]}>
                        {activeSession?.doctorStatus === 'waiting'
                            ? 'A doctor has been notified and will connect shortly. We\'ll notify you when they arrive.'
                            : 'Start chatting with your doctor below.'}
                    </Text>
                </>
            ) : (
                <>
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
                                onPress={() => setInput(s)}
                                style={[styles.suggestion, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                            >
                                <Text style={[styles.suggestionText, { color: colors.tint }]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {/* Talk to Doctor Button */}
                    <TouchableOpacity
                        style={[styles.talkDoctorBtn, { backgroundColor: isDark ? '#022c22' : '#ecfdf5', borderColor: isDark ? '#064e3b' : '#a7f3d0' }]}
                        onPress={openDoctorPicker}
                    >
                        <Text style={{ fontSize: 20 }}>👨‍⚕️</Text>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.talkDoctorTitle, { color: isDark ? '#6ee7b7' : '#065f46' }]}>Talk to a Doctor</Text>
                            <Text style={[styles.talkDoctorSub, { color: isDark ? '#4ade80' : '#059669' }]}>Pick from our list of physicians</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={isDark ? '#6ee7b7' : '#059669'} />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    // ─── Main render ──────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Sidebar */}
            {renderSidebar()}
            {renderDoctorWaitingModal()}

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9', backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={openSidebar} style={styles.headerMenuBtn}>
                    <Ionicons name="menu-outline" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={[styles.aiDot, { backgroundColor: headerDotColor }]} />
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{headerTitle}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => createNewAISession()}
                    style={[styles.newChatButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                >
                    <Ionicons name="create-outline" size={20} color={colors.tint} />
                </TouchableOpacity>
            </View>

            {/* Doctor status banner */}
            {renderDoctorBanner()}

            {/* Doctor Picker Modal */}
            <Modal
                visible={docPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setDocPickerVisible(false)}
            >
                <View style={styles.pickerOverlay}>
                    <View style={[styles.pickerSheet, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                        {/* Handle bar */}
                        <View style={[styles.pickerHandle, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />

                        <View style={styles.pickerHeader}>
                            <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose a Doctor</Text>
                            <TouchableOpacity onPress={() => setDocPickerVisible(false)}>
                                <Ionicons name="close" size={22} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {doctorsLoading ? (
                            <View style={styles.pickerLoading}>
                                <ActivityIndicator size="large" color={colors.tint} />
                                <Text style={[styles.pickerLoadingText, { color: isDark ? '#9ca3af' : '#64748b' }]}>
                                    Finding available doctors…
                                </Text>
                            </View>
                        ) : availableDoctors.length === 0 ? (
                            <View style={styles.pickerLoading}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>😔</Text>
                                <Text style={[styles.pickerLoadingText, { color: isDark ? '#9ca3af' : '#64748b' }]}>
                                    No doctors are registered yet.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
                                {availableDoctors.map(doc => (
                                    <TouchableOpacity
                                        key={doc.doctorId}
                                        style={[
                                            styles.doctorCard,
                                            {
                                                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                            }
                                        ]}
                                        onPress={() => requestDoctor(doc)}
                                        activeOpacity={0.75}
                                    >
                                        {/* Avatar */}
                                        <View style={[styles.docAvatar, {
                                            backgroundColor: isDark ? '#1e3a5f' : '#dbeafe',
                                        }]}>
                                            <Text style={styles.docAvatarText}>
                                                {doc.firstName[0]}{doc.lastName[0]}
                                            </Text>
                                        </View>

                                        {/* Info */}
                                        <View style={styles.docInfo}>
                                            <Text style={[styles.docName, { color: colors.text }]}>
                                                Dr. {doc.firstName} {doc.lastName}
                                            </Text>
                                            <Text style={[styles.docSpec, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                                {doc.specialization}
                                            </Text>
                                        </View>

                                        {/* Availability badge */}
                                        <View style={[
                                            styles.availBadge,
                                            {
                                                backgroundColor: doc.isAvailable
                                                    ? (isDark ? '#022c22' : '#d1fae5')
                                                    : (isDark ? '#1c1917' : '#fef9c3')
                                            }
                                        ]}>
                                            <View style={[styles.availDot, {
                                                backgroundColor: doc.isAvailable ? '#10b981' : '#f59e0b'
                                            }]} />
                                            <Text style={[
                                                styles.availText,
                                                {
                                                    color: doc.isAvailable
                                                        ? (isDark ? '#6ee7b7' : '#065f46')
                                                        : (isDark ? '#fde68a' : '#92400e')
                                                }
                                            ]}>
                                                {doc.isAvailable ? 'Available' : 'Busy'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Talk to Doctor FAB (only on AI sessions with messages) */}
            {activeSession?.type === 'ai' && (activeSession?.messages?.length ?? 0) > 0 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#065f46' : '#a7f3d0' }]}
                    onPress={openDoctorPicker}
                    activeOpacity={0.85}
                >
                    <Text style={{ fontSize: 14 }}>👨‍⚕️</Text>
                    <Text style={[styles.fabText, { color: isDark ? '#6ee7b7' : '#059669' }]}>Talk to Doctor</Text>
                </TouchableOpacity>
            )}

            {/* Messages */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={activeSession?.messages ?? []}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 130 }]}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        ListEmptyComponent={renderEmpty()}
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
                            placeholder={inputPlaceholder}
                            placeholderTextColor={isDark ? '#4b5563' : '#9ca3af'}
                            style={[styles.input, { color: colors.text }]}
                            multiline
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                            editable={activeSession?.type !== 'doctor' || activeSession?.doctorStatus === 'connected'}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!canSend}
                            style={[
                                styles.sendButton,
                                { backgroundColor: canSend ? colors.tint : (isDark ? '#374151' : '#e5e7eb') },
                            ]}
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={canSend ? 'white' : (isDark ? '#6b7280' : '#9ca3af')}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.disclaimer, { color: isDark ? '#374151' : '#d1d5db' }]}>
                        {activeSession?.type === 'doctor'
                            ? 'You are chatting with a licensed physician.'
                            : 'For informational purposes only. Consult a doctor for medical advice.'}
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
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerMenuBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    aiDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 17,
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

    // Sidebar
    sidebarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.40)',
        flexDirection: 'row',
    },
    sidebar: {
        width: 290,
        flex: 1,
        borderRightWidth: 1,
        paddingHorizontal: 16,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sidebarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
    },
    newSessionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        marginBottom: 10,
        gap: 8,
    },
    newSessionBtnText: {
        color: 'white',
        fontWeight: '700',
        fontFamily: 'BricolageGrotesque',
        fontSize: 14,
    },
    doctorSessionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 1.5,
        gap: 8,
    },
    doctorSessionBtnText: {
        fontWeight: '700',
        fontFamily: 'BricolageGrotesque',
        fontSize: 14,
    },
    sessionList: { flex: 1 },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    sessionItemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sessionIcon: { fontSize: 20 },
    sessionTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
    },
    sessionDate: {
        fontSize: 11,
        fontFamily: 'BricolageGrotesque',
        marginTop: 2,
    },

    // Doctor banner
    doctorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    doctorBannerText: {
        fontSize: 13,
        fontFamily: 'BricolageGrotesque',
        fontWeight: '600',
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 8,
    },

    // FAB
    fab: {
        position: 'absolute',
        top: 130,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    fabText: {
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'BricolageGrotesque',
    },

    // Waiting modal
    waitingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    waitingCard: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    waitingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'BricolageGrotesque',
        textAlign: 'center',
        marginBottom: 10,
    },
    waitingSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'BricolageGrotesque',
        lineHeight: 21,
    },
    cancelWaitBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },

    // Messages
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
    suggestionsRow: { width: '100%', gap: 8, marginBottom: 24 },
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

    // Talk to Doctor card in empty state
    talkDoctorBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    talkDoctorTitle: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'BricolageGrotesque',
    },
    talkDoctorSub: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
        marginTop: 2,
    },

    messageRow: {
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    senderLabel: {
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'BricolageGrotesque',
        marginBottom: 3,
        marginLeft: 2,
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
        maxWidth: '100%',
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

    // ── Doctor Picker Modal ────────────────────────────────────────────────────
    pickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    pickerSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingBottom: 40,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 20,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'BricolageGrotesque',
        letterSpacing: -0.3,
    },
    pickerLoading: {
        paddingVertical: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerLoadingText: {
        marginTop: 16,
        fontSize: 14,
        fontFamily: 'BricolageGrotesque',
        textAlign: 'center',
    },
    pickerList: {
        paddingHorizontal: 16,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        marginBottom: 12,
    },
    docAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    docAvatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2563eb',
    },
    docInfo: {
        flex: 1,
    },
    docName: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'BricolageGrotesque',
    },
    docSpec: {
        fontSize: 12,
        fontFamily: 'BricolageGrotesque',
        marginTop: 2,
    },
    availBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    availDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    availText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'BricolageGrotesque',
    },
});

