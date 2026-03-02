import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiProviderService {
    private readonly logger = new Logger(AiProviderService.name);

    constructor(private readonly configService: ConfigService) { }

    async generateMedicalResponse(
        message: string,
        userContext: any,
        conversationHistory: any[] = [],
    ): Promise<{
        text: string;
        confidence: number;
        source: string;
        needsDoctorReview?: boolean;
        metadata?: any;
    }> {
        // 1. Try Gemini
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (geminiKey) {
            const gemini = await this.callGemini(
                message,
                userContext,
                conversationHistory,
                geminiKey,
            );
            if (gemini) return gemini;
        }

        // 2. Mock AI (Dev Mode / No Keys)
        this.logger.log('No AI keys configured. Using Mock AI.');
        return this.callMockAI(message);
    }

    private async callGemini(
        message: string,
        userContext: any,
        conversationHistory: any[],
        apiKey: string,
    ): Promise<any | null> {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const healthProfile = userContext
                ? this.buildHealthProfile(userContext)
                : 'No health profile available';
            const queryType = this.detectQueryType(message);

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
${this.getQueryTypeGuidance(queryType)}`;

            const history = conversationHistory.map((msg) => ({
                role: msg.author === 'user' ? ('user' as const) : ('model' as const),
                parts: [{ text: msg.text }],
            }));

            const limitedHistory = history.slice(-10);

            const chat = model.startChat({
                history: [
                    {
                        role: 'user' as const,
                        parts: [{ text: systemPrompt }],
                    },
                    {
                        role: 'model' as const,
                        parts: [
                            {
                                text: 'Understood. I am Healify Assistant, ready to provide empathetic health guidance within my safety boundaries.',
                            },
                        ],
                    },
                    ...limitedHistory,
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            let text = response.text();

            if (
                text &&
                !text.includes('not a doctor') &&
                !text.includes('medical professional') &&
                !text.includes('healthcare provider')
            ) {
                text +=
                    "\n\n⚠️ *I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.*";
            }

            return {
                text,
                confidence: 0.9,
                source: 'gemini',
                metadata: { model: 'gemini-1.5-flash', queryType },
            };
        } catch (err) {
            this.logger.error('Gemini call failed:', err);
            return null;
        }
    }

    private callMockAI(message: string): any {
        const lower = message.toLowerCase();
        let text = '';

        if (lower.includes('hello') || lower.includes('hi ')) {
            text =
                "Hello! I'm Healify (Demo Mode). I can help you track symptoms or discuss general health. How are you feeling today?";
        } else if (
            lower.includes('stomach') ||
            lower.includes('pain') ||
            lower.includes('ache')
        ) {
            text =
                "It sounds like you're in some discomfort. Since I'm in demo mode, I can't give specific advice, but generally, staying hydrated and resting can help. Have you eaten anything unusual recently?";
        } else if (lower.includes('sleep') || lower.includes('tired')) {
            text =
                'Sleep is crucial for recovery. Try to maintain a consistent schedule and avoid screens before bed. Would you like some relaxation tips?';
        } else if (
            lower.includes('jog') ||
            lower.includes('run') ||
            lower.includes('exercise')
        ) {
            text =
                'Great job staying active! Regular exercise is key to health. Make sure to stay hydrated and listen to your body.';
        } else if (
            lower.includes('drink') ||
            lower.includes('water') ||
            lower.includes('soda')
        ) {
            text =
                "Hydration is important. Water is usually the best choice. Sugary or carbonated drinks might upset your stomach if you're sensitive.";
        } else {
            text =
                'I hear you. Could you tell me more about that? (Note: To get real medical AI responses, please configure your API keys in the backend .env file)';
        }

        return {
            text,
            confidence: 1.0,
            source: 'mock-ai',
            metadata: { demo: true },
        };
    }

    private buildHealthProfile(context: any): string {
        const parts: string[] = [];
        if (context.age) parts.push(`Age: ${context.age}`);
        if (context.sex) parts.push(`Sex: ${context.sex}`);
        if (context.height) parts.push(`Height: ${context.height}cm`);
        if (context.weight) parts.push(`Weight: ${context.weight}kg`);
        if (context.activityLevel) parts.push(`Activity: ${context.activityLevel}`);
        if (context.conditions?.length)
            parts.push(`Conditions: ${context.conditions.join(', ')}`);
        if (context.medications?.length)
            parts.push(`Medications: ${context.medications.join(', ')}`);
        if (context.recentSteps)
            parts.push(`Recent daily steps: ${context.recentSteps}`);
        if (context.recentSleep)
            parts.push(`Recent sleep: ${context.recentSleep}hrs`);

        return parts.length > 0
            ? parts.join(' | ')
            : 'Limited health data available';
    }

    private detectQueryType(message: string): string {
        const lower = message.toLowerCase();
        if (
            lower.includes('symptom') ||
            lower.includes('pain') ||
            lower.includes('hurt') ||
            lower.includes('ache')
        )
            return 'symptoms';
        if (
            lower.includes('sleep') ||
            lower.includes('tired') ||
            lower.includes('insomnia') ||
            lower.includes('fatigue')
        )
            return 'sleep';
        if (
            lower.includes('stress') ||
            lower.includes('anxious') ||
            lower.includes('anxiety') ||
            lower.includes('worry') ||
            lower.includes('mental')
        )
            return 'mental_health';
        if (
            lower.includes('diet') ||
            lower.includes('eat') ||
            lower.includes('food') ||
            lower.includes('nutrition') ||
            lower.includes('weight')
        )
            return 'nutrition';
        if (
            lower.includes('exercise') ||
            lower.includes('workout') ||
            lower.includes('fitness') ||
            lower.includes('active')
        )
            return 'fitness';
        if (
            lower.includes('medication') ||
            lower.includes('medicine') ||
            lower.includes('drug') ||
            lower.includes('pill')
        )
            return 'medication';
        return 'general';
    }

    private getQueryTypeGuidance(queryType: string): string {
        const guidance: Record<string, string> = {
            symptoms:
                'IMPORTANT: For symptom queries, assess severity, suggest home care when safe, and clearly indicate when to seek medical attention.',
            sleep: 'Focus on sleep hygiene tips, relaxation techniques, and lifestyle factors affecting sleep.',
            mental_health:
                'Be especially empathetic. Suggest coping strategies and always mention professional help for persistent issues.',
            nutrition:
                "Provide practical dietary suggestions. Consider user's health profile for personalized advice.",
            fitness:
                "Give safe exercise recommendations appropriate to user's activity level and any health conditions.",
            medication:
                'CAUTION: Never recommend specific medications. Advise consulting pharmacist or doctor.',
            general:
                "Provide helpful, supportive guidance based on the user's question.",
        };
        return guidance[queryType] || guidance.general;
    }
}
