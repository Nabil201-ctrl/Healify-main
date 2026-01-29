import crypto from 'crypto';

/**
 * Generate consistent anonymous ID for a user
 * Same user always gets same anonymous ID for continuity
 */
export function generateAnonymousId(userId) {
    // Use hash to create consistent anonymous ID
    const salt = process.env.ANONYMIZATION_SALT || 'default-salt-change-in-production';
    const hash = crypto
        .createHash('sha256')
        .update(userId + salt)
        .digest('hex');

    // Take first 8 characters and format nicely
    const shortHash = hash.substring(0, 8).toUpperCase();
    return `Patient #${shortHash.substring(0, 4)}-${shortHash.substring(4, 8)}`;
}

/**
 * Calculate age from birthdate
 */
function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Anonymize patient data for doctor view
 * Removes all PII and returns only medical-relevant data
 */
export function anonymizePatientData(userData, healthData) {
    const anonymousId = generateAnonymousId(userData.userId || userData._id);

    // Calculate age range from birthdate if available
    let ageRange = 'Unknown';
    if (userData.birthdate) {
        const age = calculateAge(userData.birthdate);
        ageRange = `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
    }

    return {
        anonymousId,
        ageRange,
        gender: userData.gender || 'Not specified',
        // Health data is already non-identifying
        healthMetrics: {
            heartRate: healthData?.heartRate || healthData?.averageHeartRate,
            steps: healthData?.steps || healthData?.averageSteps,
            sleep: healthData?.sleep || healthData?.averageSleep,
            quality: healthData?.quality || {
                completeness: 0,
                stability: 0,
                dataPoints: 0
            }
        },
        recentLogs: healthData?.recentLogs || [],

        // New Profile Data (Anonymized/General)
        profile: {
            bodyType: userData.bodyType || 'Not specified',
            height: userData.height, // cm
            weight: userData.weight, // kg
            activityLevel: userData.activityLevel,
            jobType: userData.jobType,
            averageSteps: userData.averageSteps,
            healthIssues: userData.healthIssues || [],
            allergies: userData.allergies || [],
            medications: userData.medications || []
        }
        // NO PII included
        // name: REMOVED
        // email: REMOVED
        // userId: REMOVED (replaced with anonymousId)
    };
}

/**
 * Anonymize chat messages
 * Replaces userId with anonymous ID
 */
export function anonymizeChatMessages(messages, userId) {
    const anonymousId = generateAnonymousId(userId);

    return messages.map(msg => ({
        id: msg._id || msg.id,
        sessionId: msg.sessionId,
        // Replace userId with anonymous ID
        anonymousPatientId: anonymousId,
        // Remove actual userId
        // userId: undefined,
        // Keep message content (medical context needed)
        text: msg.text,
        author: msg.author,
        timestamp: msg.timestamp,
        metadata: msg.metadata
    }));
}
