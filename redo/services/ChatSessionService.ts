import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageAuthor = 'me' | 'ai' | 'doctor';

export type ChatMessage = {
    id: string;
    author: MessageAuthor;
    text: string;
    timestamp: number;
    doctorName?: string;
};

export type ChatSessionType = 'ai' | 'doctor';

export type ChatSession = {
    localId: string;            // UUID generated locally
    serverSessionId: string | null; // session ID from backend
    title: string;
    type: ChatSessionType;
    messages: ChatMessage[];
    createdAt: number;
    doctorStatus?: 'waiting' | 'connected' | 'ended';
    doctorName?: string;
    /** The chosen doctor (set when user picks from the list) */
    requestedDoctor?: AvailableDoctor;
};

export type AvailableDoctor = {
    doctorId: string;
    firstName: string;
    lastName: string;
    specialization: string;
    isAvailable: boolean;
    activeChatCount: number;
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const SESSIONS_KEY = '@healify_chat_sessions';
const ACTIVE_SESSION_KEY = '@healify_active_session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function deriveTitle(messages: ChatMessage[], type: ChatSessionType, doctorName?: string): string {
    if (type === 'doctor') {
        return doctorName ? `Dr. ${doctorName}` : '👨‍⚕️ Doctor Consultation';
    }
    const first = messages.find(m => m.author === 'me');
    if (!first) return 'New Chat';
    const words = first.text.trim().split(' ').slice(0, 5).join(' ');
    return words.length < first.text.length ? `${words}…` : words;
}

// ─── ChatSessionService ───────────────────────────────────────────────────────

export const ChatSessionService = {
    /** Load all sessions from AsyncStorage */
    async loadSessions(): Promise<ChatSession[]> {
        try {
            const raw = await AsyncStorage.getItem(SESSIONS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    /** Persist all sessions */
    async saveSessions(sessions: ChatSession[]): Promise<void> {
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    },

    /** Get active session local ID */
    async getActiveSessionId(): Promise<string | null> {
        return AsyncStorage.getItem(ACTIVE_SESSION_KEY);
    },

    /** Set active session local ID */
    async setActiveSessionId(localId: string): Promise<void> {
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, localId);
    },

    /** Create a brand-new AI chat session */
    createAISession(): ChatSession {
        return {
            localId: generateId(),
            serverSessionId: null,
            title: 'New Chat',
            type: 'ai',
            messages: [],
            createdAt: Date.now(),
        };
    },

    /** Create a doctor request session for a specific doctor */
    createDoctorSession(doctor: AvailableDoctor): ChatSession {
        return {
            localId: generateId(),
            serverSessionId: null,
            title: `Dr. ${doctor.lastName}`,
            type: 'doctor',
            messages: [],
            createdAt: Date.now(),
            doctorStatus: 'waiting',
            requestedDoctor: doctor,
        };
    },

    /** Update a session in the list and persist */
    async updateSession(sessions: ChatSession[], updated: ChatSession): Promise<ChatSession[]> {
        const next = sessions.map(s => s.localId === updated.localId ? updated : s);
        await ChatSessionService.saveSessions(next);
        return next;
    },

    /** Auto-update title from messages */
    autoTitle(session: ChatSession): ChatSession {
        if (session.type === 'doctor') {
            const name = session.doctorName || session.requestedDoctor?.lastName;
            const title = name ? `Dr. ${name}` : '👨‍⚕️ Doctor Consultation';
            return { ...session, title };
        }
        if (session.messages.length > 0 && session.title === 'New Chat') {
            return { ...session, title: deriveTitle(session.messages, session.type) };
        }
        return session;
    },

    // ── Server API calls ─────────────────────────────────────────────────────

    /** Fetch all registered, active doctors */
    async getAvailableDoctors(): Promise<AvailableDoctor[]> {
        const res = await api.get('/chat/doctors');
        const data = res.data;
        if (!data?.success) throw new Error(data?.error || 'Failed to load doctors');
        return data.doctors as AvailableDoctor[];
    },

    /** Send AI chat message */
    async sendAIMessage(sessionId: string | null, message: string): Promise<{
        sessionId: string;
        response: string;
    }> {
        const res = await api.post('/chat/send', {
            message,
            sessionId: sessionId ?? undefined,
        });
        const data = res.data;
        if (!data?.success) throw new Error(data?.message || 'Server error');
        return {
            sessionId: data.sessionId,
            response: data.response || data.message || 'No response received.',
        };
    },

    /** Request a live doctor session with a specific doctor */
    async requestDoctorSession(userId: string, doctorId: string): Promise<{
        sessionId: string;
        status: 'waiting';
        doctor: AvailableDoctor;
    }> {
        const res = await api.post('/chat/request-doctor', { doctorId });
        const data = res.data;
        if (!data?.success) throw new Error(data?.error || 'Failed to request doctor');
        return {
            sessionId: data.session.sessionId,
            status: 'waiting',
            doctor: data.session.doctor,
        };
    },

    /** Poll for doctor session status & new messages */
    async pollDoctorSession(serverSessionId: string): Promise<{
        status: 'waiting' | 'connected' | 'ended';
        messages: ChatMessage[];
        doctorName?: string;
    }> {
        const res = await api.get(`/chat/live-session/${serverSessionId}`);
        const data = res.data;
        if (!data?.success) throw new Error(data?.message || 'Poll failed');

        // Map backend message shape → our ChatMessage type
        const messages: ChatMessage[] = (data.messages || []).map((m: any) => ({
            id: m.id || String(m._id),
            author: m.author === 'user' ? 'me' : m.author,
            text: m.text,
            timestamp: new Date(m.timestamp).getTime(),
            doctorName: m.doctorName ?? m.metadata?.doctorName,
        }));

        return {
            status: data.status || 'waiting',
            messages,
            doctorName: data.doctorName,
        };
    },

    /** Send a message in a live doctor session */
    async sendDoctorMessage(serverSessionId: string, text: string): Promise<void> {
        const res = await api.post(`/chat/live-session/${serverSessionId}/message`, { text });
        if (!res.data?.success) throw new Error(res.data?.error || 'Send failed');
    },
};
