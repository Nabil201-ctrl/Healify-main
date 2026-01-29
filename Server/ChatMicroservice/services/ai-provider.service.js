const MODEL_HINT = "Use concise, empathetic medical guidance. Do not diagnose; suggest next steps and safety flags.";

async function callInfermedica(message, userContext) {
    const appId = process.env.INFERMEDICA_APP_ID;
    const appKey = process.env.INFERMEDICA_APP_KEY;
    if (!appId || !appKey) return null;

    const headers = {
        'App-Id': appId,
        'App-Key': appKey,
        'Content-Type': 'application/json',
        'Model': process.env.INFERMEDICA_MODEL || 'infermedica-en'
    };

    const payload = {
        text: message,
        // Optional context to improve parsing
        age: userContext?.age ? { value: userContext.age, unit: 'year' } : undefined,
        sex: userContext?.sex,
    };

    try {
        const resp = await fetch('https://api.infermedica.com/v3/parse', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Infermedica HTTP ${resp.status}: ${errText}`);
        }

        const data = await resp.json();
        const mentions = data?.mentions || [];
        const topMention = mentions[0];
        const symptomText = topMention?.name ? `${topMention.name} (${topMention.choice_id || 'unknown'})` : 'your symptoms';

        return {
            text: `Based on what you shared, I noted ${symptomText}. Please monitor for red flags (high fever, chest pain, shortness of breath). If any appear, seek urgent care. I can suggest tailored lifestyle tips if you add more detail.`,
            confidence: 0.8,
            source: 'infermedica',
            metadata: { mentions }
        };
    } catch (err) {
        console.error('Infermedica call failed:', err);
        return {
            text: 'I had trouble reaching our clinical knowledge base. Please try again or provide a bit more detail.',
            confidence: 0.4,
            source: 'infermedica-fallback',
            needsDoctorReview: true
        };
    }
}

async function callOpenAI(message, userContext, conversationHistory = []) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    // Build health profile section if available
    const healthProfile = userContext ? buildHealthProfile(userContext) : 'No health profile available';

    // Detect query type for specialized responses
    const queryType = detectQueryType(message);

    const systemPrompt = `You are Healify Assistant, an empathetic and knowledgeable health companion.

CORE GUIDELINES:
- Be warm, supportive, and conversational while maintaining professionalism
- Provide actionable, practical health guidance
- Never diagnose conditions - guide users toward appropriate care
- Use simple language, avoid medical jargon
- Keep responses concise (under 150 words) but helpful
- Include relevant safety warnings when appropriate
- Remember context from previous messages in this conversation

RESPONSE FORMAT:
- Start with acknowledgment of user's concern
- Provide clear, structured guidance with bullet points when helpful
- End with a supportive next step or question
- Always include the medical disclaimer

USER HEALTH PROFILE:
${healthProfile}

QUERY TYPE: ${queryType}
${getQueryTypeGuidance(queryType)}`;

    // Build conversation messages
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 6 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.author === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                temperature: 0.5,
                max_tokens: 400,
                messages
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`OpenAI HTTP ${resp.status}: ${errText}`);
        }

        const data = await resp.json();
        let text = data?.choices?.[0]?.message?.content?.trim();

        // Ensure medical disclaimer is present
        if (text && !text.includes('not a doctor') && !text.includes('medical professional') && !text.includes('healthcare provider')) {
            text += '\n\n⚠️ *I\'m an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.*';
        }

        return {
            text: text || 'I want to make sure I guide you correctly. Could you share a bit more detail?',
            confidence: 0.85,
            source: 'openai',
            metadata: { model: data?.model, usage: data?.usage, queryType }
        };
    } catch (err) {
        console.error('OpenAI call failed:', err);

        if (err.name === 'AbortError') {
            return {
                text: 'I\'m taking longer than usual to think. Let me try again - could you resend your message?',
                confidence: 0.3,
                source: 'openai-timeout',
                needsDoctorReview: true
            };
        }

        return {
            text: 'I\'m having trouble connecting right now. Please try again in a moment.',
            confidence: 0.5,
            source: 'openai-fallback',
            needsDoctorReview: true
        };
    }
}

// Helper: Build health profile summary
function buildHealthProfile(context) {
    const parts = [];
    if (context.age) parts.push(`Age: ${context.age}`);
    if (context.sex) parts.push(`Sex: ${context.sex}`);
    if (context.height) parts.push(`Height: ${context.height}cm`);
    if (context.weight) parts.push(`Weight: ${context.weight}kg`);
    if (context.activityLevel) parts.push(`Activity: ${context.activityLevel}`);
    if (context.conditions?.length) parts.push(`Conditions: ${context.conditions.join(', ')}`);
    if (context.medications?.length) parts.push(`Medications: ${context.medications.join(', ')}`);
    if (context.recentSteps) parts.push(`Recent daily steps: ${context.recentSteps}`);
    if (context.recentSleep) parts.push(`Recent sleep: ${context.recentSleep}hrs`);

    return parts.length > 0 ? parts.join(' | ') : 'Limited health data available';
}

// Helper: Detect query type
function detectQueryType(message) {
    const lower = message.toLowerCase();
    if (lower.includes('symptom') || lower.includes('pain') || lower.includes('hurt') || lower.includes('ache')) return 'symptoms';
    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('insomnia') || lower.includes('fatigue')) return 'sleep';
    if (lower.includes('stress') || lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worry') || lower.includes('mental')) return 'mental_health';
    if (lower.includes('diet') || lower.includes('eat') || lower.includes('food') || lower.includes('nutrition') || lower.includes('weight')) return 'nutrition';
    if (lower.includes('exercise') || lower.includes('workout') || lower.includes('fitness') || lower.includes('active')) return 'fitness';
    if (lower.includes('medication') || lower.includes('medicine') || lower.includes('drug') || lower.includes('pill')) return 'medication';
    return 'general';
}

// Helper: Get guidance based on query type
function getQueryTypeGuidance(queryType) {
    const guidance = {
        symptoms: 'IMPORTANT: For symptom queries, assess severity, suggest home care when safe, and clearly indicate when to seek medical attention.',
        sleep: 'Focus on sleep hygiene tips, relaxation techniques, and lifestyle factors affecting sleep.',
        mental_health: 'Be especially empathetic. Suggest coping strategies and always mention professional help for persistent issues.',
        nutrition: 'Provide practical dietary suggestions. Consider user\'s health profile for personalized advice.',
        fitness: 'Give safe exercise recommendations appropriate to user\'s activity level and any health conditions.',
        medication: 'CAUTION: Never recommend specific medications. Advise consulting pharmacist or doctor.',
        general: 'Provide helpful, supportive guidance based on the user\'s question.'
    };
    return guidance[queryType] || guidance.general;
}

export async function generateMedicalResponse(message, userContext, conversationHistory = []) {
    // Prefer Infermedica when credentials exist, else OpenAI, else simple heuristic
    if (process.env.INFERMEDICA_APP_ID && process.env.INFERMEDICA_APP_KEY) {
        const infer = await callInfermedica(message, userContext);
        if (infer) return infer;
    }

    if (process.env.OPENAI_API_KEY) {
        const ai = await callOpenAI(message, userContext, conversationHistory);
        if (ai) return ai;
    }

    // Heuristic fallback
    const lower = message.toLowerCase();
    let text = 'I am here to help. Please describe your symptoms, when they started, and any key changes recently.';
    if (lower.includes('chest') || lower.includes('pain')) {
        text = 'Chest pain can be serious. If pain is severe, radiates, or you feel short of breath, seek emergency care. Otherwise, rest, track symptoms, and consider contacting a clinician.';
    } else if (lower.includes('fever')) {
        text = 'Monitor your temperature, stay hydrated, and rest. If fever exceeds 103°F/39.4°C, lasts more than 3 days, or you have severe symptoms, seek medical care.';
    }

    return {
        text,
        confidence: 0.6,
        source: 'rule-fallback',
        needsDoctorReview: true,
        metadata: { hint: MODEL_HINT }
    };
}
