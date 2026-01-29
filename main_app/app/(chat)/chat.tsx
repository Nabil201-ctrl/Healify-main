import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';

type Message = {
	id: string;
	author: 'me' | 'other';
	text: string;
	timestamp: number;
};

const Avatar = ({ uri }: { uri?: string }) => (
	<View
		style={{
			width: 32,
			height: 32,
			borderRadius: 16,
			overflow: 'hidden',
			backgroundColor: '#e5e7eb',
		}}
	>
		{uri ? (
			<Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
		) : (
			<View style={{ flex: 1 }} />
		)}
	</View>
);

export default function ChatScreen() {
	const [mode, setMode] = useState<'doctor-chat' | 'certified-response'>('doctor-chat');
	const [messages, setMessages] = useState<Message[]>([
		{ id: 'sys1', author: 'other', text: 'Hi! I am Healify assistant. How can I help you today?', timestamp: Date.now() - 1000 * 60 * 30 },
	]);
	const [input, setInput] = useState('');

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
		// TODO: call Next.js gateway -> chat microservice here
		// Example placeholder: simulate bot reply
		setTimeout(() => {
			const reply: Message = {
				id: Math.random().toString(36).slice(2),
				author: 'other',
				text:
					mode === 'doctor-chat'
						? 'A certified doctor will review and respond. Meanwhile, here are general recommendations based on your message.'
						: 'Your request has been sent for certified doctor response. You will receive a validated answer shortly.',
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, reply]);
		}, 600);
	};

	const MessageBubble = ({ item }: { item: Message }) => {
		const isMe = item.author === 'me';
		return (
			<View style={{ flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', marginVertical: 6 }}>
				<Avatar />
				<View
					style={{
						backgroundColor: isMe ? '#06B6D4' : '#F3F4F6',
						marginHorizontal: 8,
						paddingHorizontal: 14,
						paddingVertical: 10,
						borderRadius: 18,
						borderBottomRightRadius: isMe ? 4 : 18,
						borderBottomLeftRadius: isMe ? 18 : 4,
						maxWidth: '78%',
					}}
				>
					<Text style={{ color: isMe ? '#fff' : '#111827' }}>{item.text}</Text>
				</View>
			</View>
		);
	};

	return (
		<View style={{ flex: 1, backgroundColor: '#fff' }}>
			{/* Chat header: bot-oriented with two modes */}
			<View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<Avatar />
					<View style={{ marginLeft: 12, flex: 1 }}>
						<Text style={{ fontSize: 16, fontWeight: '600' }}>Healify Assistant</Text>
						<Text style={{ fontSize: 12, color: '#6b7280' }}>AI health bot</Text>
					</View>
				</View>
				<View style={{ flexDirection: 'row', marginTop: 12, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 }}>
					<TouchableOpacity
						onPress={() => setMode('doctor-chat')}
						style={{
							flex: 1,
							paddingVertical: 8,
							borderRadius: 8,
							backgroundColor: mode === 'doctor-chat' ? '#06B6D4' : 'transparent',
						}}
					>
						<Text style={{ textAlign: 'center', color: mode === 'doctor-chat' ? '#fff' : '#111827', fontWeight: '600' }}>
							Chat with a Doctor
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setMode('certified-response')}
						style={{
							flex: 1,
							paddingVertical: 8,
							borderRadius: 8,
							backgroundColor: mode === 'certified-response' ? '#06B6D4' : 'transparent',
						}}
					>
						<Text style={{ textAlign: 'center', color: mode === 'certified-response' ? '#fff' : '#111827', fontWeight: '600' }}>
							Get Certified Response
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Messages */}
			<FlatList
				data={messages}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <MessageBubble item={item} />}
				contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
			/>

			{/* Input Bar with validation hook (step1 handled by gateway) */}
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					paddingHorizontal: 12,
					paddingVertical: 10,
					borderTopWidth: 1,
					borderTopColor: '#f3f4f6',
					gap: 8,
				}}
			>
				<TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: 18, color: '#0284C7' }}>📷</Text>
				</TouchableOpacity>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12 }}>
					<TextInput
						value={input}
						onChangeText={setInput}
						placeholder="Message"
						style={{ flex: 1, paddingVertical: 10 }}
					/>
					<TouchableOpacity onPress={sendMessage} style={{ backgroundColor: '#06B6D4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginLeft: 8 }}>
						<Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
