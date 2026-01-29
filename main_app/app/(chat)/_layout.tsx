// app/(chat)/_layout.tsx
import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="chat" options={{ title: 'Chat' }} />
    </Stack>
  );
}