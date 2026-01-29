// types.ts

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  // This flag will be stored on our mock user object
  hasCompletedOnboarding: boolean;

  // Optional profile completeness fields from backend
  isProfileComplete?: boolean;
  onboardingStatus?: 'PENDING' | 'PROFILE_SETUP' | 'COMPLETED';
  location?: string;
  pushTokens?: string[];
}
