import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
}

export const AuthService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.accessToken) {
            await AsyncStorage.setItem('accessToken', response.data.accessToken);
        }
        if (response.data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return response.data;
    },

    register: async (email: string, password: string, firstName: string, lastName?: string) => {
        const response = await api.post('/auth/signup', { email, password, firstName, lastName });
        if (response.data.accessToken) {
            await AsyncStorage.setItem('accessToken', response.data.accessToken);
        }
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
    },

    getToken: async () => {
        return await AsyncStorage.getItem('accessToken');
    },

    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('accessToken');
        return !!token;
    }
};
