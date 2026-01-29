
export const Colors = {
    dark: {
        background: '#000000',
        card: '#1c1c1e',
        text: '#ffffff',
        textSecondary: '#a1a1aa', // gray-400
        border: '#27272a', // gray-800
        primary: '#10b981', // green-500
        accent: '#ffffff',
        activityRing: '#fa114f',
        steps: '#a855f7',
        distance: '#007aff',
        tabBar: 'rgba(10, 10, 10, 0.9)',
        tabBarBorder: 'rgba(255,255,255,0.1)',
    },
    light: {
        background: '#f2f2f7', // iOS grouped background
        card: '#ffffff',
        text: '#000000',
        textSecondary: '#6b7280', // gray-500
        border: '#e5e7eb', // gray-200
        primary: '#10b981',
        accent: '#000000',
        activityRing: '#fa114f',
        steps: '#a855f7',
        distance: '#007aff',
        tabBar: 'rgba(255, 255, 255, 0.9)',
        tabBarBorder: 'rgba(0,0,0,0.05)',
    }
};

export type ThemeColors = typeof Colors.dark;
