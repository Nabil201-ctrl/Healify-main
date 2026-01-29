import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessionMessages, sendMessageAsDoctor } from '../services/DoctorAuthService';
import tw from 'twrnc';

type Message = {
    id: string;
    text: string;
    author: 'user' | 'ai' | 'doctor';
    timestamp: string;
    metadata?: {
        doctorName?: string;
    };
};

export const DoctorChatInterface: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const queryClient = useQueryClient();

    const { data: messagesData, isLoading } = useQuery({
        queryKey: ['messages', sessionId],
        queryFn: () => getSessionMessages(sessionId),
        refetchInterval: 5000 // Poll every 5s for new messages
    });

    const mutation = useMutation({
        mutationFn: (text: string) => sendMessageAsDoctor(sessionId, text),
        onSuccess: () => {
            setInput('');
            queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
        }
    });

    const messages = messagesData?.messages || [];

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        mutation.mutate(input);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isDoctor = item.author === 'doctor';
        const isUser = item.author === 'user';

        return (
            <View style={tw`my-2 flex-row ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                {!isDoctor && (
                    <View style={tw`w-8 h-8 rounded-full items-center justify-center mr-2 ${isUser ? 'bg-gray-200' : 'bg-blue-100'
                        }`}>
                        <Text style={tw`text-xs`}>{isUser ? '👤' : '🤖'}</Text>
                    </View>
                )}

                <View style={tw`max-w-[80%] rounded-2xl px-4 py-3 ${isDoctor
                        ? 'bg-green-600 rounded-br-none'
                        : isUser
                            ? 'bg-gray-200 rounded-bl-none'
                            : 'bg-blue-100 rounded-bl-none'
                    }`}>
                    {isDoctor && (
                        <Text style={tw`text-xs text-green-100 mb-1 font-medium`}>
                            You ({item.metadata?.doctorName || 'Doctor'})
                        </Text>
                    )}
                    {!isDoctor && !isUser && (
                        <Text style={tw`text-xs text-blue-600 mb-1 font-medium`}>AI Assistant</Text>
                    )}

                    <Text style={tw`${isDoctor ? 'text-white' : 'text-gray-800'} text-base`}>
                        {item.text}
                    </Text>

                    <Text style={tw`text-[10px] mt-1 ${isDoctor ? 'text-green-200' : 'text-gray-500'} text-right`}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-white rounded-xl overflow-hidden border border-gray-200`}>
            <View style={tw`bg-gray-50 p-3 border-b border-gray-200`}>
                <Text style={tw`font-semibold text-gray-700`}>Live Chat Session</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={tw`p-4`}
                style={tw`flex-1`}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <View style={tw`p-3 border-t border-gray-200 flex-row items-center bg-white`}>
                    <TextInput
                        style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 border border-gray-200`}
                        placeholder="Type a message to patient..."
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity
                        style={tw`w-10 h-10 bg-green-600 rounded-full items-center justify-center ${!input.trim() || mutation.isPending ? 'opacity-50' : ''
                            }`}
                        onPress={handleSend}
                        disabled={!input.trim() || mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={tw`text-white text-lg font-bold`}>➤</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};
