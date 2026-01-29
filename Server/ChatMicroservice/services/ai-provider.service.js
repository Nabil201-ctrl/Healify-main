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

async function callOpenAI(message, userContext) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const systemPrompt = [
        'You are Healify Assistant, a cautious medical guide.',
        'Provide concise, empathetic responses in under 120 words.',
        'Never give definitive diagnoses; emphasize next steps and safety.',
        'If symptoms are concerning, advise seeing a clinician and offer red-flag warnings.',
        'Use the provided user context when available.',
        'ALWAYS include a medical disclaimer at the end of your response.'
    ].join(' ');

    const contextSnippet = userContext ? JSON.stringify(userContext).slice(0, 400) : 'No context';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                temperature: 0.4,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `User message: ${message}\nContext: ${contextSnippet}` }
                ]
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
        if (text && !text.includes('not a doctor') && !text.includes('medical professional')) {
            text += '\n\n⚠️ I am an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.';
        }

        return {
            text: text || 'I want to make sure I guide you correctly. Could you share a bit more detail?',
            confidence: 0.85,
            source: 'openai',
            metadata: { model: data?.model, usage: data?.usage }
        };
    } catch (err) {
        console.error('OpenAI call failed:', err);

        if (err.name === 'AbortError') {
            return {
                text: 'The AI service is taking too long to respond. Please try again.',
                confidence: 0.3,
                source: 'openai-timeout',
                needsDoctorReview: true
            };
        }

        return {
            text: 'I could not reach the AI service. Please try again soon.',
            confidence: 0.5,
            source: 'openai-fallback',
            needsDoctorReview: true
        };
    }
}

export async function generateMedicalResponse(message, userContext) {
    // Prefer Infermedica when credentials exist, else OpenAI, else simple heuristic
    if (process.env.INFERMEDICA_APP_ID && process.env.INFERMEDICA_APP_KEY) {
        const infer = await callInfermedica(message, userContext);
        if (infer) return infer;
    }

    if (process.env.OPENAI_API_KEY) {
        const ai = await callOpenAI(message, userContext);
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
