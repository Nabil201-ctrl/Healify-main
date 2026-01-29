import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { toggleChatBookmark } from '../../services/ChatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';

// API Configuration - uses environment variable with fallback
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Quick suggestion topics for empty chat
const QUICK_SUGGESTIONS = [
	{ id: 'symptoms', label: '🩺 Track Symptoms', message: "I'd like to track some symptoms I've been experiencing" },
	{ id: 'sleep', label: '😴 Sleep Help', message: "I've been having trouble sleeping lately" },
	{ id: 'stress', label: '🧘 Stress Relief', message: 'I feel stressed and need some relaxation tips' },
	{ id: 'nutrition', label: '🥗 Nutrition Tips', message: 'Can you give me some healthy eating advice?' },
	{ id: 'fitness', label: '🏃 Fitness Guide', message: 'I want to start exercising more regularly' },
];

type QuickSuggestion = {
	id: string;
	label: string;
	message: string;
};

type Message = {
	id: string;
	author: 'me' | 'other' | 'doctor';
	text: string;
	timestamp: number;
	metadata?: {
		doctorId?: string;
		doctorName?: string;
	};
};

const Avatar = ({ uri }: { uri?: string }) => (
	<View
		style={{
			width: 36,
			height: 36,
			borderRadius: 18,
			overflow: 'hidden',
			backgroundColor: '#e5e7eb',
			borderWidth: 1,
			borderColor: '#f3f4f6'
		}}
	>
		{uri ? (
			<Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
		) : (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#06B6D4' }}>
				<Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>AI</Text>
			</View>
		)}
	</View>
);

export default function ChatScreen() {
	const { isDark, colors } = useTheme();
	const { user } = useAuthContext();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(true);
	const flatListRef = useRef<FlatList>(null);

	// Handle quick suggestion tap
	const handleQuickSuggestion = (suggestion: QuickSuggestion) => {
		setInput(suggestion.message);
		setShowSuggestions(false);
	};

	// Load History on Mount
	useEffect(() => {
		if (user) {
			loadHistory();
		}
	}, [user]);

	const loadHistory = async () => {
		try {
			const token = await AsyncStorage.getItem('accessToken');
			const userId = user?.id || "user_123";

			if (!token) return;

			const response = await fetch(`${API_URL}/chat/history/${userId}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});

			const data = await response.json();
			if (data.success && data.history) {
				const formattedMessages = data.history.map((m: any) => ({
					id: m.id,
					author: m.author === 'me' ? 'me' : 'other',
					text: m.text,
					timestamp: new Date(m.timestamp).getTime()
				}));
				setMessages(formattedMessages);
				setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
			}
		} catch (error) {
			console.error("Failed to load history:", error);
		}
	};

	const pollForResponse = async (sessionId: string) => {
		setIsTyping(true);
		const token = await AsyncStorage.getItem('accessToken');
		if (!token) {
			setIsTyping(false);
			return;
		}

		const pollInterval = setInterval(async () => {
			try {
				const response = await fetch(`${API_URL}/chat/session/${sessionId}`, {
					headers: { 'Authorization': `Bearer ${token}` }
				});
				const data = await response.json();

				if (data.success && data.session.status === 'completed') {
					clearInterval(pollInterval);
					setIsTyping(false);

					const reply: Message = {
						id: Math.random().toString(36).slice(2),
						author: 'other',
						text: data.session.response,
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, reply]);
					setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
				}
			} catch (error) {
				clearInterval(pollInterval);
				setIsTyping(false);
			}
		}, 1000);

		setTimeout(() => {
			clearInterval(pollInterval);
			setIsTyping(false);
		}, 30000);
	};

	const sendMessage = async () => {
		const trimmed = input.trim();
		if (!trimmed) return;

		const msg: Message = {
			id: Math.random().toString(36).slice(2),
			author: 'me',
			text: trimmed,
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, msg]);
		setInput('');
		setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

		try {
			const token = await AsyncStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch(`${API_URL}/chat/send`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ message: trimmed })
			});

			const data = await response.json();
			if (data.success) {
				setCurrentSessionId(data.sessionId);
				pollForResponse(data.sessionId);
			}
		} catch (error) {
			console.error("Error sending message:", error);
		}
	};

	const handleBookmarkToggle = async () => {
		if (!currentSessionId) return;
		try {
			await toggleChatBookmark(currentSessionId, !isBookmarked);
			setIsBookmarked(!isBookmarked);
		} catch (error) {
			console.error('Failed to toggle bookmark:', error);
		}
	};

	const MessageBubble = ({ item }: { item: Message }) => {
		const isMe = item.author === 'me';
		const isDoctor = item.author === 'doctor';

		return (
			<View style={{ flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', marginVertical: 8 }}>
				{!isMe && (
					<View style={{
						width: 36, height: 36, borderRadius: 18, overflow: 'hidden',
						backgroundColor: isDoctor ? '#10b981' : '#06B6D4',
						borderWidth: 2, borderColor: isDoctor ? '#059669' : '#0891b2',
						justifyContent: 'center', alignItems: 'center', marginRight: 8
					}}>
						<Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
							{isDoctor ? '👨‍⚕️' : 'AI'}
						</Text>
					</View>
				)}
				<View
					style={{
						backgroundColor: isMe
							? colors.primary // User color (Green)
							: colors.card,   // AI/Doctor color (Dark/Light card)
						paddingHorizontal: 16,
						paddingVertical: 12,
						borderRadius: 20,
						borderBottomRightRadius: isMe ? 4 : 20,
						borderBottomLeftRadius: isMe ? 20 : 4,
						maxWidth: '75%',
						borderWidth: isMe ? 0 : 1,
						borderColor: isMe ? 'transparent' : colors.border
					}}
				>
					{isDoctor && (
						<Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 }}>
							{item.metadata?.doctorName || '👨‍⚕️ Doctor'}
						</Text>
					)}
					<Text style={{
						color: isMe ? '#fff' : colors.text, // White text for user, theme text for AI
						fontSize: 15,
						lineHeight: 22
					}}>
						{item.text}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: colors.background }} // Global background
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
		>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

			{/* Chat header */}
			<View style={{
				paddingHorizontal: 16,
				paddingVertical: 12,
				paddingTop: 60, // Safe Area padding roughly
				borderBottomWidth: 1,
				borderBottomColor: colors.border,
				backgroundColor: colors.background
			}}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<View style={{
						width: 40, height: 40, borderRadius: 20,
						backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
						borderWidth: 1, borderColor: colors.border
					}}>
						<Text style={{ fontSize: 20 }}>🤖</Text>
					</View>
					<View style={{ marginLeft: 12, flex: 1 }}>
						<Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Healify Assistant</Text>
						<Text style={{ fontSize: 12, color: colors.textSecondary }}>Always here for you</Text>
					</View>
					<TouchableOpacity
						onPress={handleBookmarkToggle}
						disabled={!currentSessionId}
						style={{
							padding: 8, borderRadius: 20,
							backgroundColor: colors.card,
							borderWidth: 1, borderColor: colors.border,
							opacity: currentSessionId ? 1 : 0.5,
						}}
					>
						<Text style={{ fontSize: 20, color: colors.text }}>{isBookmarked ? '⭐' : '☆'}</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Messages */}
			<FlatList
				ref={flatListRef}
				data={messages}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <MessageBubble item={item} />}
				contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 130 }}
				ListFooterComponent={isTyping ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginTop: 5 }}>
						<View style={{ marginLeft: 44, backgroundColor: colors.card, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: colors.border }}>
							<Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 12 }}>Thinking...</Text>
						</View>
					</View>
				) : null}
				onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
			/>

			{/* Input Bar */}
			<View
				style={{
					flexDirection: 'row', alignItems: 'center',
					paddingHorizontal: 16, paddingVertical: 12,
					borderTopWidth: 1, borderTopColor: colors.border,
					backgroundColor: colors.background, // Match background
					paddingBottom: Platform.OS === 'ios' ? 90 : 80 // Clear the floating tab bar
				}}
			>
				<View style={{
					flex: 1, flexDirection: 'row', alignItems: 'center',
					backgroundColor: colors.card, borderRadius: 24,
					paddingHorizontal: 16, paddingVertical: 4,
					borderWidth: 1, borderColor: colors.border
				}}>
					<TextInput
						value={input}
						onChangeText={setInput}
						placeholder="Type a message..."
						placeholderTextColor={colors.textSecondary}
						style={{ flex: 1, paddingVertical: 10, color: colors.text, fontSize: 15 }}
						multiline
						maxLength={500}
					/>
				</View>
				<TouchableOpacity
					onPress={sendMessage}
					disabled={!input.trim()}
					style={{
						backgroundColor: input.trim() ? colors.primary : colors.card,
						width: 44, height: 44, borderRadius: 22, marginLeft: 12,
						alignItems: 'center', justifyContent: 'center',
						borderWidth: input.trim() ? 0 : 1, borderColor: colors.border
					}}>
					<Text style={{ fontSize: 20, color: input.trim() ? '#fff' : colors.textSecondary }}>➤</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}