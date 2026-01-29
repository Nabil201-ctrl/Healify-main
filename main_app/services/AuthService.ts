import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { User } from '../types';

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

const signIn = async (email: string, password: string):Promise<{ accessToken: string; refreshToken: string; user: User }> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

const signUp = async (userData: SignUpData): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
  const { data } = await api.post('/auth/signup', userData);
  return data;
};

const signOut = async (): Promise<void> => {
  console.log('[AuthService] Signing out user.');
  await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
};

const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await AsyncStorage.multiSet([
    ["accessToken", accessToken],
    ["refreshToken", refreshToken]
  ]);
};

const getAccessToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem("accessToken");
};

// Request new tokens using the refresh token
const refreshToken = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
  if (!storedRefreshToken) {
    console.error("[AuthService] No refresh token available");
    throw new Error("No refresh token available");
  }
  try {
    console.log("[AuthService] Attempting to refresh token...");
    const { data } = await api.post("/auth/refresh", {}, {
      headers: { Authorization: `Bearer ${storedRefreshToken}` }
    });
    
    console.log("[AuthService] Token refresh successful");
    await saveTokens(data.accessToken, data.refreshToken);
    return data;
  } catch (error) {
    console.error("[AuthService] Token refresh failed:", error);
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    throw error;
  }
};

export const AuthService = {
  signIn,
  signUp,
  signOut,
  saveTokens,
  getAccessToken,
  refreshToken
};
