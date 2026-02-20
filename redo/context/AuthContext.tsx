import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '@/services/auth.service';
import { authEvents } from '@/services/authEvents';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
    authState: AuthState;
    /** Call after a successful login/register */
    onAuthSuccess: () => void;
    /** Call to sign out and redirect to login */
    signOut: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>('loading');
    const isLoggingOut = useRef(false);

    // Check stored token on mount
    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('accessToken');
                setAuthState(token ? 'authenticated' : 'unauthenticated');
            } catch {
                setAuthState('unauthenticated');
            }
        })();
    }, []);

    const signOut = useCallback(async () => {
        if (isLoggingOut.current) return;
        isLoggingOut.current = true;
        try {
            await AuthService.logout();
        } finally {
            isLoggingOut.current = false;
            setAuthState('unauthenticated');
        }
    }, []);

    const onAuthSuccess = useCallback(() => {
        setAuthState('authenticated');
    }, []);

    // Listen for unauthorized events fired by the Axios interceptor
    useEffect(() => {
        const handleUnauthorized = () => {
            console.warn('[AuthContext] Token invalid/expired — signing out');
            signOut();
        };
        authEvents.on('unauthorized', handleUnauthorized);
        return () => authEvents.off('unauthorized', handleUnauthorized);
    }, [signOut]);

    return (
        <AuthContext.Provider value={{ authState, onAuthSuccess, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
