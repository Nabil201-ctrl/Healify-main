import * as crypto from 'crypto';

/**
 * Generate consistent anonymous ID for a user
 */
export function generateAnonymousId(userId: string): string {
    const salt =
        process.env.ANONYMIZATION_SALT || 'default-salt-change-in-production';
    const hash = crypto
        .createHash('sha256')
        .update(userId + salt)
        .digest('hex');

    const shortHash = hash.substring(0, 8).toUpperCase();
    return `Patient #${shortHash.substring(0, 4)}-${shortHash.substring(4, 8)}`;
}

/**
 * Anonymize patient data for doctor view
 */
export function anonymizePatientData(userData: any, healthData: any): any {
    const anonymousId = generateAnonymousId(userData.userId || userData._id);

    let ageRange = 'Unknown';
    if (userData.birthdate) {
        const today = new Date();
        const birth = new Date(userData.birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
            age--;
        }
        ageRange = `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
    }

    return {
        anonymousId,
        ageRange,
        gender: userData.gender || 'Not specified',
        healthMetrics: {
            heartRate: healthData?.heartRate || healthData?.averageHeartRate,
            steps: healthData?.steps || healthData?.averageSteps,
            sleep: healthData?.sleep || healthData?.averageSleep,
            quality: healthData?.quality || {
                completeness: 0,
                stability: 0,
                dataPoints: 0,
            },
        },
        recentLogs: healthData?.recentLogs || [],
        profile: {
            bodyType: userData.bodyType || 'Not specified',
            height: userData.height,
            weight: userData.weight,
            activityLevel: userData.activityLevel,
            jobType: userData.jobType,
            averageSteps: userData.averageSteps,
            healthIssues: userData.healthIssues || [],
            allergies: userData.allergies || [],
            medications: userData.medications || [],
        },
    };
}

/**
 * Anonymize chat messages
 */
export function anonymizeChatMessages(
    messages: any[],
    userId: string,
): any[] {
    const anonymousId = generateAnonymousId(userId);

    return messages.map((msg) => ({
        id: msg._id || msg.id,
        sessionId: msg.sessionId,
        anonymousPatientId: anonymousId,
        text: msg.text,
        author: msg.author,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
    }));
}
