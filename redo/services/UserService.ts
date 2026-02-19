import api from './api';

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    location?: string;
    age?: number;
    height?: number; // cm
    weight?: number; // kg
    bodyType?: string; // 'Slim' | 'Lean' | 'Fat' | 'Average'
    activityLevel?: string; // 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'
    jobType?: string; // 'Active' | 'Office' | 'Mixed'
    averageSteps?: number;
    healthIssues?: string[];
    allergies?: string[];
    medications?: string[];
    isProfileComplete?: boolean;
}

export const UserService = {
    /**
     * Fetch the current user's profile
     */
    getProfile: async (): Promise<UserProfile> => {
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    /**
     * Update the current user's profile
     */
    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            const response = await api.patch('/users/me', data);
            return response.data;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    /**
     * Update user location
     */
    setLocation: async (location: string) => {
        try {
            const response = await api.post('/users/location', { location });
            return response.data;
        } catch (error) {
            console.error('Error setting location:', error);
            throw error;
        }
    }
};
