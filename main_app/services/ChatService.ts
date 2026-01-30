import api from '../api/api';

/**
 * Toggle bookmark status for a chat session
 */
export const toggleChatBookmark = async (sessionId: string, isBookmarked: boolean) => {
    try {
        const response = await api.post(`https://healify-chat.onrender.com/bookmark/${sessionId}`, {
            isBookmarked,
        });
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to toggle bookmark:', error);
        throw error;
    }
};

/**
 * Get all bookmarked chat sessions for a user
 */
export const getBookmarkedChats = async (userId: string) => {
    try {
        const response = await api.get(`https://healify-chat.onrender.com/bookmarks/${userId}`);
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to fetch bookmarks:', error);
        throw error;
    }
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (message: string, sessionId?: string) => {
    try {
        const response = await api.post('/chat/send', {
            message,
            sessionId,
        });
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to send message:', error);
        throw error;
    }
};

/**
 * Get chat session status
 */
export const getChatSession = async (sessionId: string) => {
    try {
        const response = await api.get(`/chat/session/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to get session:', error);
        throw error;
    }
};

/**
 * Get chat history for a user
 */
export const getChatHistory = async (userId: string) => {
    try {
        const response = await api.get(`/chat/history/${userId}`);
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to get chat history:', error);
        throw error;
    }
};

/**
 * Get all chat sessions for a user
 */
export const getChatSessions = async (userId: string) => {
    try {
        const response = await api.get(`/chat/sessions/${userId}`);
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to get chat sessions:', error);
        throw error;
    }
};

/**
 * Get messages for a specific session
 */
export const getSessionMessages = async (sessionId: string) => {
    try {
        const response = await api.get(`/chat/session/${sessionId}/messages`);
        return response.data;
    } catch (error) {
        console.error('[ChatService] Failed to get session messages:', error);
        throw error;
    }
};
