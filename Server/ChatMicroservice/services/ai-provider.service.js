import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

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

async function callGemini(message, userContext, conversationHistory = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("DEBUG: GEMINI_API_KEY is missing in process.env");
        return null;
    }
    console.log("DEBUG: GEMINI_API_KEY found, attempting to call Gemini...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build health profile section if available
        const healthProfile = userContext ? buildHealthProfile(userContext) : 'No health profile available';
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

        // Convert history to Gemini format
        const history = conversationHistory.map(msg => ({
            role: msg.author === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Limit history to last 10 messages to avoid token limits
        const limitedHistory = history.slice(-10);

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Healify Assistant, ready to provide empathetic health guidance within my safety boundaries." }]
                },
                ...limitedHistory
            ]
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        let text = response.text();

        // Ensure medical disclaimer is present
        if (text && !text.includes('not a doctor') && !text.includes('medical professional') && !text.includes('healthcare provider')) {
            text += '\n\n⚠️ *I\'m an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.*';
        }

        return {
            text,
            confidence: 0.9,
            source: 'gemini',
            metadata: { model: "gemini-1.5-flash", queryType }
        };

    } catch (err) {
        console.error('DEBUG: Gemini call failed with error:', err);
        return null; // Fallback to other providers
    }
}



// Mock AI for when no keys are present
function callMockAI(message, history) {
    const lower = message.toLowerCase();
    let text = "";

    // Simple keyword matching for demo/dev purposes
    if (lower.includes('hello') || lower.includes('hi ')) {
        text = "Hello! I'm Healify (Demo Mode). I can help you track symptoms or discuss general health. How are you feeling today?";
    } else if (lower.includes('stomach') || lower.includes('pain') || lower.includes('ache')) {
        text = "It sounds like you're in some discomfort. Since I'm in demo mode, I can't give specific advice, but generally, staying hydrated and resting can help. Have you eaten anything unusual recently?";
    } else if (lower.includes('sleep') || lower.includes('tired')) {
        text = "Sleep is crucial for recovery. Try to maintain a consistent schedule and avoid screens before bed. Would you like some relaxation tips?";
    } else if (lower.includes('jog') || lower.includes('run') || lower.includes('exercise')) {
        text = "Great job staying active! Regular exercise is key to health. Make sure to stay hydrated and listen to your body.";
    } else if (lower.includes('drink') || lower.includes('water') || lower.includes('soda')) {
        text = "Hydration is important. Water is usually the best choice. Sugary or carbonated drinks might upset your stomach if you're sensitive.";
    } else {
        text = "I hear you. Could you tell me more about that? (Note: To get real medical AI responses, please configure your API keys in the backend .env file)";
    }

    return {
        text,
        confidence: 1.0,
        source: 'mock-ai',
        metadata: { demo: true }
    };
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
    // 1. Try Gemini (Primary Health AI) - PREFERRED
    if (process.env.GEMINI_API_KEY) {
        const gemini = await callGemini(message, userContext, conversationHistory);
        if (gemini) return gemini;
    }

    // 2. Try Infermedica (Diagnostic/Clinical parsing) - SECONDARY/DISABLED
    /* 
    if (process.env.INFERMEDICA_APP_ID && process.env.INFERMEDICA_APP_KEY) {
        const infer = await callInfermedica(message, userContext);
        if (infer) return infer;
    } 
    */



    // 4. Mock AI (Dev Mode / No Keys)
    // If we get here, no AI services are configured. Use a smart mock response.
    console.log('No AI keys configured. Using Mock AI.');
    return callMockAI(message, conversationHistory);

    // 4. Heuristic fallback
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
