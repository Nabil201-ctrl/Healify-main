import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StatusBar, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { toggleChatBookmark, getChatSessions, getSessionMessages, sendChatMessage, getChatSession } from '../../services/ChatService';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

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

type ChatSession = {
	sessionId: string;
	title: string;
	updatedAt: string;
	preview?: string;
};

export default function ChatScreen() {
	const { isDark, colors } = useTheme();
	const { user } = useAuthContext();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const flatListRef = useRef<FlatList>(null);

	// Sidebar State
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

	useEffect(() => {
		if (user) {
			loadSessions();
		}
	}, [user]);

	const loadSessions = async () => {
		try {
			const userId = user?.id || "user_123";
			const data = await getChatSessions(userId);
			if (data.success) {
				setSessions(data.sessions);
			}
		} catch (error) {
			console.error("Failed to load sessions:", error);
		}
	};

	const loadSessionMessages = async (sessionId: string) => {
		try {
			const data = await getSessionMessages(sessionId);
			if (data.success) {
				const formattedMessages = data.messages.map((m: any) => ({
					id: m.id,
					author: m.author,
					text: m.text,
					timestamp: new Date(m.timestamp).getTime(),
					metadata: m.metadata
				}));
				setMessages(formattedMessages);
				setCurrentSessionId(sessionId);
				closeSidebar();
				setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
			}
		} catch (error) {
			console.error("Failed to load session messages:", error);
		}
	};

	const startNewChat = () => {
		setMessages([]);
		setCurrentSessionId(null);
		closeSidebar();
	};

	const toggleSidebar = () => {
		if (isSidebarOpen) {
			closeSidebar();
		} else {
			openSidebar();
		}
	};

	const openSidebar = () => {
		setIsSidebarOpen(true);
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	};

	const closeSidebar = () => {
		Animated.timing(slideAnim, {
			toValue: -SIDEBAR_WIDTH,
			duration: 300,
			useNativeDriver: true,
		}).start(() => setIsSidebarOpen(false));
	};

	// Modified poller to use ChatService
	const pollForResponse = async (sessionId: string) => {
		setIsTyping(true);
		// Using ChatService.getChatSession which already uses axios/api

		const pollInterval = setInterval(async () => {
			try {
				const data = await getChatSession(sessionId);

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

					// Refresh sessions to show new title/update
					loadSessions();
				}
			} catch (error) {
				// Keep polling or handle error limit
				// don't break immediately
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
			// Using ChatService.sendChatMessage
			// Note: Service expects (message, sessionId?)
			const data = await sendChatMessage(trimmed, currentSessionId || undefined);

			if (data.success) {
				if (!currentSessionId) {
					setCurrentSessionId(data.sessionId);
					loadSessions(); // Reload list for new session
				}
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
			<View style={{ flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start', marginVertical: 10 }}>
				{!isMe && (
					<View style={{
						width: 32, height: 32, borderRadius: 16,
						backgroundColor: isDoctor ? '#10b981' : '#0ea5e9',
						justifyContent: 'center', alignItems: 'center', marginRight: 8,
						marginTop: 2
					}}>
						<Text style={{ fontSize: 16 }}>
							{isDoctor ? '👨‍⚕️' : '🤖'}
						</Text>
					</View>
				)}
				<View
					style={{
						backgroundColor: isMe ? colors.primary : colors.card,
						paddingHorizontal: 16,
						paddingVertical: 12,
						borderRadius: 18,
						borderTopLeftRadius: !isMe ? 4 : 18,
						borderTopRightRadius: isMe ? 4 : 18,
						maxWidth: '80%',
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 1 },
						shadowOpacity: 0.1,
						shadowRadius: 1,
						elevation: 1
					}}
				>
					{isDoctor && (
						<Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', marginBottom: 4 }}>
							{item.metadata?.doctorName || 'Doctor'}
						</Text>
					)}
					<Text style={{
						color: isMe ? '#fff' : colors.text,
						fontSize: 16,
						lineHeight: 24
					}}>
						{item.text}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: colors.background }}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
		>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

			{/* Header */}
			<View style={{
				flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
				paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
				backgroundColor: colors.background,
				borderBottomWidth: 1, borderBottomColor: colors.border,
				zIndex: 10
			}}>
				<TouchableOpacity onPress={toggleSidebar} style={{ padding: 4 }}>
					<Ionicons name="menu" size={28} color={colors.text} />
				</TouchableOpacity>

				<Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
					{currentSessionId ? 'Healify Chat' : 'New Chat'}
				</Text>

				<View style={{ flexDirection: 'row', gap: 12 }}>
					<TouchableOpacity onPress={startNewChat}>
						<Ionicons name="create-outline" size={26} color={colors.primary} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Main Chat Area */}
			<View style={{ flex: 1 }}>
				{messages.length === 0 && !currentSessionId ? (
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
						<Ionicons name="chatbubbles-outline" size={80} color={colors.textSecondary} />
						<Text style={{ marginTop: 16, fontSize: 18, color: colors.textSecondary, fontWeight: '500' }}>
							Start a new conversation
						</Text>
					</View>
				) : (
					<FlatList
						ref={flatListRef}
						data={messages}
						keyExtractor={item => item.id}
						renderItem={({ item }) => <MessageBubble item={item} />}
						contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 20 }}
						ListFooterComponent={isTyping ? (
							<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 40, marginTop: 8 }}>
								<Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>Healify is thinking...</Text>
							</View>
						) : null}
						onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
					/>
				)}
			</View>

			{/* Input Area */}
			<View style={{
				paddingHorizontal: 16, paddingVertical: 12,
				borderTopWidth: 1, borderTopColor: colors.border,
				backgroundColor: colors.background,
				paddingBottom: Platform.OS === 'ios' ? 30 : 150, // Increased for web/android tabs
				alignItems: 'center' // Use flex alignment to center children
			}}>
				<View style={{
					flexDirection: 'row', alignItems: 'center',
					backgroundColor: colors.card,
					borderRadius: 24,
					paddingHorizontal: 16,
					borderWidth: 1, borderColor: colors.border,
					width: '100%',
					maxWidth: 800, // Limit width on large screens
					alignSelf: 'center' // Ensure it centers
				}}>
					<TextInput
						value={input}
						onChangeText={setInput}
						placeholder="Message Healify..."
						placeholderTextColor={colors.textSecondary}
						style={{ flex: 1, paddingVertical: 12, color: colors.text, fontSize: 16, maxHeight: 100 }}
						multiline
						maxLength={1000}
					/>
					<TouchableOpacity
						onPress={sendMessage}
						disabled={!input.trim()}
						style={{
							marginLeft: 8,
							padding: 8,
							opacity: input.trim() ? 1 : 0.5
						}}>
						<Ionicons name="arrow-up-circle" size={32} color={colors.primary} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Sidebar Overlay */}
			{isSidebarOpen && (
				<TouchableOpacity
					activeOpacity={1}
					onPress={closeSidebar}
					style={{
						position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 20
					}}
				/>
			)}

			{/* Sidebar Drawer */}
			<Animated.View style={{
				position: 'absolute', top: 0, bottom: 0, left: 0,
				width: SIDEBAR_WIDTH,
				backgroundColor: isDark ? '#1f2937' : '#f9fafb',
				zIndex: 30,
				transform: [{ translateX: slideAnim }],
				shadowColor: "#000",
				shadowOffset: { width: 2, height: 0 },
				shadowOpacity: 0.25,
				shadowRadius: 3.84,
				elevation: 5
			}}>
				<View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 20, flex: 1 }}>
					<TouchableOpacity
						onPress={startNewChat}
						style={{
							flexDirection: 'row', alignItems: 'center',
							backgroundColor: colors.primary,
							padding: 12, borderRadius: 12,
							marginBottom: 20
						}}
					>
						<Ionicons name="add" size={24} color="white" />
						<Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>New Chat</Text>
					</TouchableOpacity>

					<Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, paddingLeft: 4 }}>
						Recent History
					</Text>

					<FlatList
						data={sessions}
						keyExtractor={item => item.sessionId}
						renderItem={({ item }) => (
							<TouchableOpacity
								onPress={() => loadSessionMessages(item.sessionId)}
								style={{
									paddingVertical: 12, paddingHorizontal: 12,
									borderRadius: 10,
									backgroundColor: currentSessionId === item.sessionId ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
									marginBottom: 4
								}}
							>
								<Text numberOfLines={1} style={{ fontSize: 15, color: colors.text, fontWeight: currentSessionId === item.sessionId ? '600' : '400' }}>
									{item.title}
								</Text>
								<Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
									{new Date(item.updatedAt).toLocaleDateString()}
								</Text>
							</TouchableOpacity>
						)}
					/>
				</View>
			</Animated.View>
		</KeyboardAvoidingView>
	);
}