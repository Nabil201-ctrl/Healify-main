import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Use localhost for simulator, or your machine's IP for physical device
const API_URL = 'http://10.189.240.13:3000';

export const doctorLogin = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${API_URL}/doctor/login`, {
            email,
            password
        });

        if (response.data.success) {
            await AsyncStorage.setItem('doctorAccessToken', response.data.accessToken);
            await AsyncStorage.setItem('doctorRefreshToken', response.data.refreshToken);
            await AsyncStorage.setItem('doctorInfo', JSON.stringify(response.data.doctor));
            return response.data.doctor;
        }

        throw new Error(response.data.message);
    } catch (error: any) {
        console.error('Doctor login failed:', error);
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

export const doctorRegister = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    licenseNumber: string;
}) => {
    try {
        const response = await axios.post(`${API_URL}/doctor/register`, data);

        if (response.data.success) {
            // Auto-login after registration — store tokens immediately
            await AsyncStorage.setItem('doctorAccessToken', response.data.accessToken);
            await AsyncStorage.setItem('doctorRefreshToken', response.data.refreshToken);
            await AsyncStorage.setItem('doctorInfo', JSON.stringify(response.data.doctor));
            return response.data.doctor;
        }

        throw new Error(response.data.message);
    } catch (error: any) {
        console.error('Doctor registration failed:', error);
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

export const doctorLogout = async () => {
    await AsyncStorage.removeItem('doctorAccessToken');
    await AsyncStorage.removeItem('doctorRefreshToken');
    await AsyncStorage.removeItem('doctorInfo');
};

export const getDoctorInfo = async () => {
    const info = await AsyncStorage.getItem('doctorInfo');
    return info ? JSON.parse(info) : null;
};

export const getDoctorReviewQueue = async () => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.get(`${API_URL}/doctor/review-queue`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.sessions;
};

export const assignSessionToMe = async (sessionId: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/assign/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.session;
};

export const sendMessageAsDoctor = async (sessionId: string, text: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/message/${sessionId}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.message;
};

export const completeReview = async (sessionId: string, notes: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/complete-review/${sessionId}`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.session;
};

export const getSessionMessages = async (sessionId: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.get(`${API_URL}/doctor/session-messages/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });


    return response.data;
};

export const registerPushToken = async (token: string) => {
    const authToken = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/push-token`,
        { token },
        { headers: { Authorization: `Bearer ${authToken}` } }
    );

    return response.data;
};

// ── Live Patient Chat (Talk to Doctor feature) ────────────────────────────────

export const getIncomingPatientChats = async () => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.get(`${API_URL}/doctor/live-chats`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.chats || [];
};

export const acceptPatientChat = async (sessionId: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/live-chats/${sessionId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.session;
};

export const getLiveChatMessages = async (sessionId: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.get(`${API_URL}/doctor/live-chats/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.messages || [];
};

export const sendMessageToPatient = async (sessionId: string, text: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/live-chats/${sessionId}/message`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.message;
};

export const endPatientChat = async (sessionId: string, notes?: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');

    const response = await axios.post(
        `${API_URL}/doctor/live-chats/${sessionId}/end`,
        { notes: notes || '' },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
};
