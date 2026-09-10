import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please set GROQ_API_KEY in .env.local.');
  }
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

export const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export interface StructuredAiRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}

/**
 * Server-side helper to request structured JSON extraction from Groq
 */
export async function callGroqStructuredExtraction<T>({
  systemPrompt,
  userPrompt,
  model = GROQ_DEFAULT_MODEL,
  temperature = 0.1
}: StructuredAiRequest): Promise<T> {
  const groq = getGroqClient();

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Groq returned an empty response.');
    }

    try {
      const parsed = JSON.parse(responseContent) as T;
      return parsed;
    } catch {
      console.error('Failed to parse Groq JSON output:', responseContent);
      throw new Error('Malformed JSON returned by AI extraction layer.');
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Groq AI extraction error:', errorMsg);
    if (errorMsg.includes('401') || errorMsg.includes('API key')) {
      throw new Error('Invalid Groq API key or unauthorized access.');
    }
    if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      throw new Error('Groq rate limit reached. Please try again in a few moments.');
    }
    throw error;
  }
}
