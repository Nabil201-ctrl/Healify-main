/**
 * AI Safety Utilities
 * Functions for analyzing query clarity, health data quality, and generating clarifications
 */

/**
 * Analyze how clear/specific a user's query is
 * Returns score from 0 (very vague) to 1 (very specific)
 */
export function analyzeQueryClarity(message: string): number {
    const vagueIndicators = [
        'something',
        'anything',
        'stuff',
        'thing',
        'things',
        'not feeling well',
        'feel bad',
        'hurts',
        'pain',
        'sick',
        'ill',
        'unwell',
        'weird',
        'strange',
    ];

    const specificIndicators = [
        'sharp pain',
        'dull ache',
        'throbbing',
        'burning',
        'since',
        'when',
        'how long',
        'days',
        'weeks',
        'specific location',
        'symptoms',
        'started',
        'chest',
        'head',
        'stomach',
        'back',
        'arm',
        'leg',
        'fever',
        'cough',
        'nausea',
        'dizzy',
        'shortness of breath',
    ];

    let score = 0.5;
    const lowerMessage = message.toLowerCase();

    vagueIndicators.forEach((term) => {
        if (lowerMessage.includes(term)) score -= 0.08;
    });

    specificIndicators.forEach((term) => {
        if (lowerMessage.includes(term)) score += 0.12;
    });

    const wordCount = message.split(/\s+/).length;
    if (wordCount > 20) score += 0.1;
    if (wordCount < 5) score -= 0.15;

    return Math.max(0, Math.min(1, score));
}

/**
 * Generate clarification questions based on user's message
 */
export function generateClarificationRequest(message: string): string {
    const clarificationTemplates = [
        'To provide accurate guidance, could you be more specific about:',
        "I'd like to help you better. Can you tell me:",
        'For a more accurate assessment, please clarify:',
        'To give you the best advice, I need more details about:',
    ];

    const questions: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (
        lowerMessage.includes('pain') ||
        lowerMessage.includes('hurt') ||
        lowerMessage.includes('ache')
    ) {
        questions.push('- Where exactly is the pain located?');
        questions.push('- When did it start?');
        questions.push('- Is it sharp, dull, or throbbing?');
        questions.push('- What makes it better or worse?');
        questions.push('- On a scale of 1-10, how severe is it?');
    }

    if (
        lowerMessage.includes('feel') ||
        lowerMessage.includes('sick') ||
        lowerMessage.includes('unwell')
    ) {
        questions.push('- What specific symptoms are you experiencing?');
        questions.push('- When did you first notice these symptoms?');
        questions.push('- Have you had similar symptoms before?');
        questions.push('- Are you taking any medications?');
    }

    if (
        lowerMessage.includes('breath') ||
        lowerMessage.includes('breathing')
    ) {
        questions.push('- Is it hard to breathe at rest or during activity?');
        questions.push('- Do you have chest pain or tightness?');
        questions.push('- When did this start?');
    }

    if (questions.length === 0) {
        questions.push('- What symptoms are you experiencing?');
        questions.push('- When did they start?');
        questions.push('- How severe are they?');
        questions.push('- Have you noticed any patterns or triggers?');
    }

    const template =
        clarificationTemplates[
        Math.floor(Math.random() * clarificationTemplates.length)
        ];
    return `${template}\n\n${questions.join('\n')}\n\nProviding these details will help me give you more accurate health guidance.`;
}

/**
 * Assess health data quality
 */
export function assessHealthDataQuality(healthContext: any): {
    completeness: number;
    stability: number;
    dataPoints: number;
} {
    const recentLogs = healthContext?.recentLogs || [];
    const completeness = Math.min(1, recentLogs.length / 7);

    let stability = 1.0;

    if (recentLogs.length > 1) {
        const heartRates = recentLogs
            .map((log: any) => log.heartRate)
            .filter(Boolean);

        if (heartRates.length > 1) {
            const mean =
                heartRates.reduce((a: number, b: number) => a + b) / heartRates.length;
            const variance =
                heartRates.reduce(
                    (sum: number, val: number) => sum + Math.pow(val - mean, 2),
                    0,
                ) / heartRates.length;
            const stdDev = Math.sqrt(variance);
            const cv = stdDev / mean;

            stability = Math.max(0, 1 - cv / 0.3);
        }
    }

    return {
        completeness: Math.round(completeness * 100) / 100,
        stability: Math.round(stability * 100) / 100,
        dataPoints: recentLogs.length,
    };
}

/**
 * Generate warning message for poor health data quality
 */
export function generateHealthDataWarning(quality: {
    completeness: number;
    stability: number;
    dataPoints: number;
}): string {
    let warning = 'I notice that ';

    if (quality.completeness < 0.5) {
        warning +=
            'your health data is incomplete (only ' +
            quality.dataPoints +
            ' days of data). ';
    }

    if (quality.stability < 0.6) {
        warning += 'your health metrics show unusual variations. ';
    }

    warning += '\n\n⚠️ For accurate medical guidance, I recommend:\n';
    warning += '1. Syncing your health data regularly for at least 7 days\n';
    warning += '2. Ensuring consistent daily tracking\n';
    warning += '3. A healthcare professional will review your case\n\n';
    warning += '📱 A doctor will contact you through this chat soon.\n\n';
    warning +=
        '🚨 If you\'re experiencing severe symptoms, please seek immediate medical attention or call emergency services.';

    return warning;
}
