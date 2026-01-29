import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_completed';

/**
 * Checks if the user has completed the onboarding flow.
 */
const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (e) {
    console.error('[OnboardingService] Error checking onboarding status:', e);
    return false;
  }
};

/**
 * Marks the onboarding flow as completed.
 */
const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    console.error('[OnboardingService] Error setting onboarding status:', e);
  }
};

export const OnboardingService = {
  hasCompletedOnboarding,
  setOnboardingCompleted,
};
