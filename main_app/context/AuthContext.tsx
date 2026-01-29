import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/AuthService';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for an existing session on app startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        let token = await AsyncStorage.getItem('accessToken');
        let refreshTokenStored = await AsyncStorage.getItem('refreshToken');
        let triedRefresh = false;

        // Only try to refresh if we have a refresh token
        if (!token && refreshTokenStored) {
          try {
            console.log('[AuthContext] No access token, attempting refresh...');
            const { accessToken } = await AuthService.refreshToken();
            token = accessToken;
            triedRefresh = true;
          } catch (refreshError) {
            console.error('[AuthContext] Refresh failed on startup:', refreshError);
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }

        // Only try to fetch user if we have a token
        if (token) {
          try {
            const { data } = await api.get('/users/me');
            setUser(data);
          } catch (error) {
            console.error('[AuthContext] Error fetching user:', error);
            if (!triedRefresh && refreshTokenStored) {
              // Try refresh once if user fetch fails and we haven't tried yet
              try {
                console.log('[AuthContext] User fetch failed, attempting refresh...');
                const { accessToken } = await AuthService.refreshToken();
                await AsyncStorage.setItem('accessToken', accessToken);
                const { data } = await api.get('/users/me');
                setUser(data);
              } catch (refreshError) {
                console.error('[AuthContext] Refresh failed after user fetch error:', refreshError);
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
                setUser(null);
              }
            } else {
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('[AuthContext] Error checking session:', e);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] Starting sign in...');
    const { accessToken, refreshToken, user } = await AuthService.signIn(email, password);
    console.log('[AuthContext] Received tokens and user:', user);
    await AuthService.saveTokens(accessToken, refreshToken);
    console.log('[AuthContext] Tokens saved, setting user state');
    setUser(user);
    console.log('[AuthContext] User state set, isSignedIn should now be true');

    // Register for push notifications after successful login
    try {
      const { registerAndUploadPushToken } = await import('../services/NotificationService');
      const success = await registerAndUploadPushToken();
      if (success) {
        console.log('[AuthContext] Push notification token registered');
      }
    } catch (error) {
      console.error('[AuthContext] Error registering push notifications:', error);
      // Don't fail login if push notification registration fails
    }
  }, []);

  const signUp = useCallback(async (userData: SignUpData) => {
    console.log('[AuthContext] Starting sign up...');
    const { accessToken, refreshToken, user } = await AuthService.signUp(userData);
    console.log('[AuthContext] Received tokens and user:', user);
    await AuthService.saveTokens(accessToken, refreshToken);
    console.log('[AuthContext] Tokens saved, setting user state');
    setUser(user);
    console.log('[AuthContext] User state set, isSignedIn should now be true');

    // Register for push notifications after successful signup
    try {
      const { registerAndUploadPushToken } = await import('../services/NotificationService');
      const success = await registerAndUploadPushToken();
      if (success) {
        console.log('[AuthContext] Push notification token registered');
      }
    } catch (error) {
      console.error('[AuthContext] Error registering push notifications:', error);
      // Don't fail signup if push notification registration fails
    }
  }, []);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    setUser(null);
  }, []);

  const reloadUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch (error) {
      console.error('[AuthContext] Error reloading user:', error);
    }
  }, []);

  const value = {
    user,
    isSignedIn: !!user,
    isLoading,
    signIn,
    signOut,
    signUp,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};