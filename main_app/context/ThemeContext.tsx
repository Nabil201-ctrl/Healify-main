import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '../constants/Theme';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  isLoading: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'user_theme_preference';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('[ThemeContext] Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
      console.log('[ThemeContext] Theme changed to:', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('[ThemeContext] Error saving theme:', error);
    }
  };

  const colors = isDark ? Colors.dark : Colors.light;

  const value = {
    isDark,
    toggleTheme,
    isLoading,
    colors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
