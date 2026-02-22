import { Alert } from 'react-native';
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
            console.warn('Error fetching user profile:', error);
            throw error;
        }
    },

    /**
     * Update the current user's profile
     */
    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            // Strictly whitelist properties to avoid backend forbidNonWhitelisted validation errors
            const allowedKeys = [
                'firstName', 'lastName', 'age', 'height', 'weight', 'sleepHours',
                'bodyType', 'gender', 'bloodType', 'healthIssues', 'chronicConditions',
                'allergies', 'medications', 'averageSteps', 'activityLevel', 'jobType',
                'daysLessActive', 'smokingStatus', 'alcoholUse', 'maritalStatus',
                'hasChildren', 'numberOfChildren', 'emergencyContactName',
                'emergencyContactPhone', 'location'
            ];

            const patchData: any = {};
            for (const key of allowedKeys) {
                if (key in data && data[key as keyof UserProfile] !== undefined) {
                    let val = (data as any)[key];
                    if (key === 'medications' && Array.isArray(val)) {
                        // strip internal IDs from medications to prevent ValidationPipe errors
                        val = val.map((med: any) => {
                            const { _id, id, __v, createdAt, updatedAt, ...cleanMed } = med;
                            return cleanMed;
                        });
                    }
                    if (typeof val === 'number' && Number.isNaN(val)) {
                        continue;
                    }
                    if (val === '') {
                        continue; // Skip empty strings to prevent enum validation errors on backend
                    }
                    patchData[key] = val;
                }
            }

            // Send the patch payload
            const response = await api.patch('/users/me', patchData);
            return response.data;
        } catch (error: any) {
            console.warn('Error updating user profile:', error?.response?.data || error.message); Alert.alert('Detailed Error', JSON.stringify(error?.response?.data || error.message));
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
            console.warn('Error setting location:', error);
            throw error;
        }
    }
};
