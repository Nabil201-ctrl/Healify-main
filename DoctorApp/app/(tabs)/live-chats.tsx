import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, FlatList, RefreshControl, ActivityIndicator,
    TouchableOpacity, Modal, TextInput, KeyboardAvoidingView,
    Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getIncomingPatientChats,
    acceptPatientChat,
    getLiveChatMessages,
    sendMessageToPatient,
    endPatientChat,
} from '../../services/DoctorAuthService';
import { useAuth } from '../../context/DoctorAuthContext';
import tw from 'twrnc';

// ─── Types ────────────────────────────────────────────────────────────────────

type PatientChat = {
    sessionId: string;
    anonymousPatientId: string;
    status: 'waiting' | 'connected' | 'ended';
    createdAt: string;
    lastMessage?: string;
    messageCount: number;
};

type ChatMessage = {
    id: string;
    text: string;
    author: 'user' | 'doctor' | 'ai';
    timestamp: string;
    metadata?: { doctorName?: string };
};

// ─── Live Chats Screen ────────────────────────────────────────────────────────

export default function LiveChatsScreen() {
    const { doctor } = useAuth();
    const queryClient = useQueryClient();
    const flatListRef = useRef<FlatList>(null);

    // Active chat modal
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');

    // ── Queries ───────────────────────────────────────────────────────────────

    const {
        data: chats = [],
        refetch,
        isLoading,
    } = useQuery<PatientChat[]>({
        queryKey: ['live-chats'],
        queryFn: getIncomingPatientChats,
        refetchInterval: 8000,
    });

    const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
        queryKey: ['live-chat-messages', activeChatId],
        queryFn: () => getLiveChatMessages(activeChatId!),
        enabled: !!activeChatId,
        refetchInterval: 4000,
    });

    // ── Mutations ─────────────────────────────────────────────────────────────

    const acceptMutation = useMutation({
        mutationFn: (sessionId: string) => acceptPatientChat(sessionId),
        onSuccess: (_, sessionId) => {
            queryClient.invalidateQueries({ queryKey: ['live-chats'] });
            setActiveChatId(sessionId);
        },
        onError: (err: any) => Alert.alert('Error', err.message || 'Failed to accept chat'),
    });

    const sendMutation = useMutation({
        mutationFn: ({ sessionId, text }: { sessionId: string; text: string }) =>
            sendMessageToPatient(sessionId, text),
        onSuccess: () => {
            setInput('');
            queryClient.invalidateQueries({ queryKey: ['live-chat-messages', activeChatId] });
        },
        onError: (err: any) => Alert.alert('Error', err.message || 'Failed to send message'),
    });

    const endMutation = useMutation({
        mutationFn: (sessionId: string) => endPatientChat(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['live-chats'] });
            setActiveChatId(null);
        },
        onError: (err: any) => Alert.alert('Error', err.message || 'Failed to end chat'),
    });

    // ── Scroll to bottom when messages change ─────────────────────────────────
    React.useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSend = () => {
        if (!input.trim() || !activeChatId) return;
        sendMutation.mutate({ sessionId: activeChatId, text: input.trim() });
    };

    const handleEndChat = () => {
        Alert.alert(
            'End Consultation',
            'Are you sure you want to end this consultation?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End', style: 'destructive',
                    onPress: () => activeChatId && endMutation.mutate(activeChatId),
                },
            ]
        );
    };

    // ── Status badge ──────────────────────────────────────────────────────────

    const statusBadge = (status: PatientChat['status']) => {
        if (status === 'waiting') return tw`bg-yellow-100`;
        if (status === 'connected') return tw`bg-green-100`;
        return tw`bg-gray-100`;
    };

    const statusText = (status: PatientChat['status']) => {
        if (status === 'waiting') return { text: 'Waiting', color: '#92400e' };
        if (status === 'connected') return { text: 'Connected', color: '#065f46' };
        return { text: 'Ended', color: '#374151' };
    };

    // ── Render Chat Card ──────────────────────────────────────────────────────

    const renderChat = useCallback(({ item }: { item: PatientChat }) => {
        const status = statusText(item.status);

        return (
            <View style={tw`bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3`}>
                            <Text style={tw`text-blue-600 font-bold text-sm`}>
                                {item.anonymousPatientId.substring(8, 10).toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={tw`font-bold text-gray-800`}>{item.anonymousPatientId}</Text>
                            <Text style={tw`text-xs text-gray-400`}>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' · '}{item.messageCount} messages
                            </Text>
                        </View>
                    </View>
                    <View style={[tw`px-3 py-1 rounded-full`, statusBadge(item.status)]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: status.color }}>{status.text}</Text>
                    </View>
                </View>

                {item.lastMessage && (
                    <Text style={tw`text-gray-500 text-sm mb-3`} numberOfLines={2}>
                        {item.lastMessage}
                    </Text>
                )}

                <View style={tw`flex-row gap-2`}>
                    {item.status === 'waiting' && (
                        <TouchableOpacity
                            style={tw`flex-1 bg-green-600 py-3 rounded-xl items-center`}
                            onPress={() => acceptMutation.mutate(item.sessionId)}
                            disabled={acceptMutation.isPending}
                        >
                            {acceptMutation.isPending ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={tw`text-white font-bold`}>Accept Chat</Text>
                            )}
                        </TouchableOpacity>
                    )}
                    {item.status === 'connected' && (
                        <TouchableOpacity
                            style={tw`flex-1 bg-blue-600 py-3 rounded-xl items-center`}
                            onPress={() => setActiveChatId(item.sessionId)}
                        >
                            <Text style={tw`text-white font-bold`}>Open Chat</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'ended' && (
                        <View style={tw`flex-1 bg-gray-100 py-3 rounded-xl items-center`}>
                            <Text style={tw`text-gray-500 font-bold`}>Consultation Ended</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    }, [acceptMutation]);

    // ── Render Message ────────────────────────────────────────────────────────

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
        const isDoctor = item.author === 'doctor';
        const isUser = item.author === 'user';

        return (
            <View style={tw`my-2 flex-row ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                {!isDoctor && (
                    <View style={tw`w-8 h-8 rounded-full items-center justify-center mr-2 ${isUser ? 'bg-gray-200' : 'bg-blue-100'}`}>
                        <Ionicons name={isUser ? "person" : "hardware-chip"} size={16} color={isUser ? "#6b7280" : "#2563eb"} />
                    </View>
                )}
                <View style={tw`max-w-[80%] rounded-2xl px-4 py-3 ${isDoctor
                    ? 'bg-green-600 rounded-br-sm'
                    : isUser
                        ? 'bg-gray-200 rounded-bl-sm'
                        : 'bg-blue-100 rounded-bl-sm'
                    }`}>
                    {isDoctor && (
                        <Text style={tw`text-xs text-green-100 mb-1 font-medium`}>
                            You (Dr. {item.metadata?.doctorName || doctor?.lastName || 'Doctor'})
                        </Text>
                    )}
                    {!isDoctor && !isUser && (
                        <Text style={tw`text-xs text-blue-600 mb-1 font-medium`}>AI Assistant</Text>
                    )}
                    <Text style={tw`${isDoctor ? 'text-white' : 'text-gray-800'} text-base`}>{item.text}</Text>
                    <Text style={tw`text-[10px] mt-1 ${isDoctor ? 'text-green-200' : 'text-gray-500'} text-right`}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    }, [doctor]);

    // ── Chat Modal ────────────────────────────────────────────────────────────

    const activeChat = chats.find(c => c.sessionId === activeChatId);

    const renderChatModal = () => (
        <Modal
            visible={!!activeChatId}
            animationType="slide"
            onRequestClose={() => setActiveChatId(null)}
        >
            <View style={tw`flex-1 bg-white`}>
                {/* Modal Header */}
                <View style={tw`bg-white pt-14 pb-4 px-4 border-b border-gray-200 flex-row items-center`}>
                    <TouchableOpacity onPress={() => setActiveChatId(null)} style={tw`mr-3`}>
                        <Text style={tw`text-blue-600 font-medium`}>← Back</Text>
                    </TouchableOpacity>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-bold text-gray-900 text-base`}>
                            {activeChat?.anonymousPatientId || 'Patient Chat'}
                        </Text>
                        <View style={tw`flex-row items-center mt-0.5`}>
                            <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-1.5`} />
                            <Text style={tw`text-xs text-green-600 font-medium`}>Live Consultation</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={tw`bg-red-50 border border-red-200 px-3 py-2 rounded-xl`}
                        onPress={handleEndChat}
                        disabled={endMutation.isPending}
                    >
                        <Text style={tw`text-red-600 font-bold text-sm`}>End</Text>
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                {messagesLoading && messages.length === 0 ? (
                    <View style={tw`flex-1 justify-center items-center`}>
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item, i) => item.id || i.toString()}
                        contentContainerStyle={tw`p-4 pb-2`}
                        style={tw`flex-1`}
                        ListEmptyComponent={
                            <View style={tw`flex-1 justify-center items-center py-20`}>
                                <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" style={tw`mb-3`} />
                                <Text style={tw`text-gray-500 text-center`}>
                                    No messages yet. Start the consultation by saying hello.
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={tw`p-3 border-t border-gray-200 flex-row items-center bg-white pb-8`}>
                        <TextInput
                            style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 border border-gray-200 text-gray-900`}
                            placeholder="Type your message to patient..."
                            value={input}
                            onChangeText={setInput}
                            multiline
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            style={tw`w-11 h-11 bg-green-600 rounded-full items-center justify-center ${!input.trim() || sendMutation.isPending ? 'opacity-50' : ''}`}
                            onPress={handleSend}
                            disabled={!input.trim() || sendMutation.isPending}
                        >
                            {sendMutation.isPending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );

    // ─── Main Render ──────────────────────────────────────────────────────────

    const waitingChats = chats.filter(c => c.status === 'waiting');
    const activeChats = chats.filter(c => c.status === 'connected');
    const pastChats = chats.filter(c => c.status === 'ended');

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {renderChatModal()}

            {/* Header */}
            <View style={tw`bg-white pt-12 pb-4 px-4 border-b border-gray-200 shadow-sm`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <View>
                        <Text style={tw`text-2xl font-bold text-gray-900`}>Live Chats</Text>
                        <Text style={tw`text-sm text-gray-500 mt-0.5`}>Direct patient consultations</Text>
                    </View>
                    {waitingChats.length > 0 && (
                        <View style={tw`bg-red-500 w-6 h-6 rounded-full items-center justify-center`}>
                            <Text style={tw`text-white text-xs font-bold`}>{waitingChats.length}</Text>
                        </View>
                    )}
                </View>
            </View>

            {isLoading && chats.length === 0 ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <ScrollView
                    style={tw`flex-1`}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563eb" />}
                    contentContainerStyle={tw`p-4`}
                >
                    {/* Waiting Requests */}
                    {waitingChats.length > 0 && (
                        <>
                            <View style={tw`flex-row items-center mb-3`}>
                                <View style={tw`w-2 h-2 rounded-full bg-yellow-500 mr-2`} />
                                <Text style={tw`text-sm font-bold text-gray-700 uppercase tracking-wide`}>
                                    Waiting ({waitingChats.length})
                                </Text>
                            </View>
                            {waitingChats.map(item => (
                                <View key={item.sessionId}>
                                    {renderChat({ item })}
                                </View>
                            ))}
                        </>
                    )}

                    {/* Active Chats */}
                    {activeChats.length > 0 && (
                        <>
                            <View style={tw`flex-row items-center mb-3 mt-2`}>
                                <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-2`} />
                                <Text style={tw`text-sm font-bold text-gray-700 uppercase tracking-wide`}>
                                    Active ({activeChats.length})
                                </Text>
                            </View>
                            {activeChats.map(item => (
                                <View key={item.sessionId}>
                                    {renderChat({ item })}
                                </View>
                            ))}
                        </>
                    )}

                    {/* Recent Past Chats */}
                    {pastChats.length > 0 && (
                        <>
                            <View style={tw`flex-row items-center mb-3 mt-2`}>
                                <View style={tw`w-2 h-2 rounded-full bg-gray-400 mr-2`} />
                                <Text style={tw`text-sm font-bold text-gray-700 uppercase tracking-wide`}>
                                    Recent ({pastChats.length})
                                </Text>
                            </View>
                            {pastChats.slice(0, 5).map(item => (
                                <View key={item.sessionId}>
                                    {renderChat({ item })}
                                </View>
                            ))}
                        </>
                    )}

                    {/* Empty state */}
                    {chats.length === 0 && (
                        <View style={tw`flex-1 justify-center items-center py-24`}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#e5e7eb" style={tw`mb-4`} />
                            <Text style={tw`text-lg font-bold text-gray-700`}>No Live Chats</Text>
                            <Text style={tw`text-gray-500 text-center mt-2 max-w-xs`}>
                                When patients request to talk to a doctor, they'll appear here.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}
