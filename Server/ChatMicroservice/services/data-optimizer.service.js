/**
 * Data Optimizer Service
 * Optimizes and summarizes user data for AI context
 * Reduces token usage and improves AI response quality
 */

/**
 * Summarize health metrics for AI context
 * @param {object} healthData - Raw health data
 * @returns {object} Summarized health metrics
 */
export function summarizeHealthMetrics(healthData) {
    if (!healthData) return null;

    const summary = {
        recentVitals: {},
        trends: {},
        alerts: [],
    };

    // Summarize recent vitals (last 7 days)
    if (healthData.heartRate && Array.isArray(healthData.heartRate)) {
        const recent = healthData.heartRate.slice(-7);
        summary.recentVitals.heartRate = {
            avg: average(recent.map(r => r.value)),
            min: Math.min(...recent.map(r => r.value)),
            max: Math.max(...recent.map(r => r.value)),
            latest: recent[recent.length - 1]?.value,
        };
    }

    if (healthData.bloodPressure && Array.isArray(healthData.bloodPressure)) {
        const recent = healthData.bloodPressure.slice(-7);
        summary.recentVitals.bloodPressure = {
            systolic: {
                avg: average(recent.map(r => r.systolic)),
                latest: recent[recent.length - 1]?.systolic,
            },
            diastolic: {
                avg: average(recent.map(r => r.diastolic)),
                latest: recent[recent.length - 1]?.diastolic,
            },
        };
    }

    if (healthData.steps && Array.isArray(healthData.steps)) {
        const recent = healthData.steps.slice(-7);
        summary.recentVitals.steps = {
            dailyAvg: average(recent.map(r => r.value)),
            latest: recent[recent.length - 1]?.value,
        };
    }

    // Identify trends (improving, stable, declining)
    if (healthData.heartRate && healthData.heartRate.length >= 14) {
        const firstWeek = healthData.heartRate.slice(-14, -7);
        const secondWeek = healthData.heartRate.slice(-7);
        const trend = compareTrends(firstWeek, secondWeek);
        summary.trends.heartRate = trend;
    }

    return summary;
}

/**
 * Extract relevant medical history
 * @param {object} userProfile - User profile data
 * @returns {object} Relevant medical history
 */
export function extractMedicalHistory(userProfile) {
    if (!userProfile) return null;

    return {
        age: userProfile.age,
        conditions: userProfile.healthIssues || [],
        allergies: userProfile.allergies || [],
        medications: userProfile.medications || [],
        bodyType: userProfile.bodyType,
        activityLevel: userProfile.activityLevel,
    };
}

/**
 * Format data for AI consumption
 * Creates a concise, token-efficient summary
 * @param {object} userProfile - User profile
 * @param {object} healthData - Health metrics
 * @returns {string} Formatted context string
 */
export function formatForAI(userProfile, healthData) {
    const medical = extractMedicalHistory(userProfile);
    const metrics = summarizeHealthMetrics(healthData);

    const parts = [];

    // Basic info
    if (medical) {
        parts.push(`Patient: ${medical.age}yo, ${medical.bodyType || 'unknown'} build, ${medical.activityLevel || 'unknown'} activity`);

        if (medical.conditions && medical.conditions.length > 0) {
            parts.push(`Conditions: ${medical.conditions.join(', ')}`);
        }

        if (medical.allergies && medical.allergies.length > 0) {
            parts.push(`Allergies: ${medical.allergies.join(', ')}`);
        }

        if (medical.medications && medical.medications.length > 0) {
            parts.push(`Medications: ${medical.medications.join(', ')}`);
        }
    }

    // Recent vitals
    if (metrics && metrics.recentVitals) {
        const vitals = [];

        if (metrics.recentVitals.heartRate) {
            vitals.push(`HR: ${metrics.recentVitals.heartRate.latest} bpm (avg ${Math.round(metrics.recentVitals.heartRate.avg)})`);
        }

        if (metrics.recentVitals.bloodPressure) {
            const bp = metrics.recentVitals.bloodPressure;
            vitals.push(`BP: ${bp.systolic.latest}/${bp.diastolic.latest} mmHg`);
        }

        if (metrics.recentVitals.steps) {
            vitals.push(`Steps: ${metrics.recentVitals.steps.latest} (avg ${Math.round(metrics.recentVitals.steps.dailyAvg)})`);
        }

        if (vitals.length > 0) {
            parts.push(`Recent vitals: ${vitals.join(', ')}`);
        }
    }

    // Trends
    if (metrics && metrics.trends) {
        const trends = [];

        if (metrics.trends.heartRate) {
            trends.push(`HR ${metrics.trends.heartRate}`);
        }

        if (trends.length > 0) {
            parts.push(`Trends: ${trends.join(', ')}`);
        }
    }

    return parts.join('. ') + '.';
}

/**
 * Optimize data for Infermedica API
 * @param {object} userProfile - User profile
 * @param {string} message - User message
 * @returns {object} Optimized payload for Infermedica
 */
export function optimizeForInfermedica(userProfile, message) {
    return {
        text: message,
        age: userProfile?.age ? { value: userProfile.age, unit: 'year' } : undefined,
        sex: userProfile?.sex || 'unknown',
        // Add other relevant fields
    };
}

/**
 * Optimize data for OpenAI API
 * @param {object} userProfile - User profile
 * @param {object} healthData - Health data
 * @returns {string} Optimized context for OpenAI
 */
export function optimizeForOpenAI(userProfile, healthData) {
    return formatForAI(userProfile, healthData);
}

// Helper functions

function average(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function compareTrends(firstPeriod, secondPeriod) {
    const avg1 = average(firstPeriod.map(r => r.value));
    const avg2 = average(secondPeriod.map(r => r.value));

    const change = ((avg2 - avg1) / avg1) * 100;

    if (Math.abs(change) < 5) return 'stable';
    if (change > 0) return 'increasing';
    return 'decreasing';
}

/**
 * Remove PII (Personally Identifiable Information) from data
 * @param {object} data - Data to sanitize
 * @returns {object} Sanitized data
 */
export function removePII(data) {
    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.email;
    delete sanitized.firstName;
    delete sanitized.lastName;
    delete sanitized.phone;
    delete sanitized.address;
    delete sanitized._id;
    delete sanitized.id;

    return sanitized;
}
