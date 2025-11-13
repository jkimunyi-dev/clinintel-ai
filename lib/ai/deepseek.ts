/**
 * DeepSeek AI Integration
 * Handles interaction with DeepSeek API for medical analysis
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

/**
 * Send a chat completion request to DeepSeek
 */
export async function sendChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<DeepSeekResponse> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: options?.stream ?? false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`DeepSeek API error: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Stream chat completion from DeepSeek
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ReadableStream> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`DeepSeek API error: ${error.error || response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body;
}

/**
 * Analyze patient data with AI
 */
export async function analyzePatientData(
  patientData: {
    name: string;
    age?: number;
    gender?: string;
    medicalHistory?: string;
    currentSymptoms?: string;
    labResults?: any;
    medications?: string[];
  },
  query: string,
  agentType: 'diabetic' | 'general' = 'general'
): Promise<string> {
  const systemPrompt = getSystemPrompt(agentType);
  
  const patientContext = formatPatientContext(patientData);
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${patientContext}\n\nQuestion: ${query}` },
  ];

  const response = await sendChatCompletion(messages, {
    temperature: 0.3, // Lower temperature for medical advice
    maxTokens: 3000,
  });

  return response.choices[0]?.message?.content || 'No response generated';
}

/**
 * Get system prompt based on agent type
 */
function getSystemPrompt(agentType: 'diabetic' | 'general'): string {
  // This will be replaced by prompts from agents.ts
  if (agentType === 'diabetic') {
    return 'You are a specialized diabetes doctor assistant.';
  }
  return 'You are a general medical doctor assistant.';
}

/**
 * Format patient data for context
 */
function formatPatientContext(patientData: any): string {
  let context = `Patient Information:\n`;
  context += `- Name: ${patientData.name}\n`;
  
  if (patientData.age) {
    context += `- Age: ${patientData.age} years\n`;
  }
  
  if (patientData.gender) {
    context += `- Gender: ${patientData.gender}\n`;
  }
  
  if (patientData.medicalHistory) {
    context += `\nMedical History:\n${patientData.medicalHistory}\n`;
  }
  
  if (patientData.currentSymptoms) {
    context += `\nCurrent Symptoms:\n${patientData.currentSymptoms}\n`;
  }
  
  if (patientData.labResults) {
    context += `\nLab Results:\n${JSON.stringify(patientData.labResults, null, 2)}\n`;
  }
  
  if (patientData.medications && patientData.medications.length > 0) {
    context += `\nCurrent Medications:\n${patientData.medications.join(', ')}\n`;
  }
  
  return context;
}
