import api from "../api";

export const authRequests = {
    // Example: Verify onboarding completion
    completeOnboarding: async (userId: string) => {
        try {
            const response = await api.post(`/auth/${userId}/onboarding`, {
                completed: true,
            });
            return response.data;
        } catch (error) {
            console.error("Error completing onboarding:", error);
            throw error;
        }
    },

    // Example: Check user onboarding status
    checkOnboardingStatus: async (userId: string) => {
        try {
            const response = await api.get(`/auth/${userId}/onboarding`);
            return response.data;
        } catch (error) {
            console.error("Error checking onboarding status:", error);
            throw error;
        }
    },
};
