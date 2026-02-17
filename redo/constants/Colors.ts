const tintColorLight = '#4f46e5'; // Indigo 600
const tintColorDark = '#818cf8'; // Indigo 400

export default {
  light: {
    text: '#1e293b', // Slate 800
    textSecondary: '#64748b', // Slate 500
    background: '#f8fafc', // Slate 50
    tint: tintColorLight,
    tabIconDefault: '#94a3b8', // Slate 400
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    border: '#e2e8f0', // Slate 200
    // Accents
    primary: '#4f46e5',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  dark: {
    text: '#f1f5f9', // Slate 100
    textSecondary: '#94a3b8', // Slate 400
    background: '#0f172a', // Slate 900
    tint: tintColorDark,
    tabIconDefault: '#64748b', // Slate 500
    tabIconSelected: tintColorDark,
    card: '#1e293b', // Slate 800
    border: '#334155', // Slate 700
    // Accents
    primary: '#6366f1',
    secondary: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
  },
};
