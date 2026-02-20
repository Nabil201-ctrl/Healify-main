import api from './api';

export interface Medication {
    name: string;
    reason: string;       // What it's for
    dosage?: string;      // e.g. "500mg twice daily"
    endDate?: string;     // ISO date string, empty = ongoing
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    location?: string;

    // Physical
    age?: number;
    height?: number;       // cm
    weight?: number;       // kg
    bodyType?: string;     // 'Slim' | 'Lean' | 'Average' | 'Athletic' | 'Overweight'
    gender?: string;       // 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'

    // Lifestyle
    activityLevel?: string;    // 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'
    jobType?: string;          // 'Active' | 'Office' | 'Mixed'
    averageSteps?: number;
    daysLessActive?: string[];
    smokingStatus?: string;    // 'Never' | 'Former' | 'Current'
    alcoholUse?: string;       // 'None' | 'Occasional' | 'Moderate' | 'Heavy'
    sleepHours?: number;       // average hrs / night

    // Personal
    maritalStatus?: string;    // 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Prefer not to say'
    hasChildren?: boolean;
    numberOfChildren?: number;
    emergencyContactName?: string;
    emergencyContactPhone?: string;

    // Medical
    healthIssues?: string[];
    allergies?: string[];
    medications?: Medication[];   // rich medication objects
    bloodType?: string;           // 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown'
    chronicConditions?: string[]; // e.g. Diabetes, Hypertension

    // Meta
    isProfileComplete?: boolean;
    onboardingStatus?: string;
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
