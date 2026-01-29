import api from "../api";

export const userRequests = {
    // Get user profile
    getProfile: async () => {
        try {
            const response = await api.get("/user/profile");
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    // Update user profile
    updateProfile: async (data: Record<string, any>) => {
        try {
            const response = await api.put("/user/profile", data);
            return response.data;
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    },

    // Example: fetch user dashboard data
    getDashboardData: async () => {
        try {
            const response = await api.get("/user/dashboard");
            return response.data;
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            throw error;
        }
    },
};
