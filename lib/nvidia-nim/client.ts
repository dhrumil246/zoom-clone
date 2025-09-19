// lib/nvidia-nim/client.ts

export interface NimSpeechToTextOptions {
  language?: string;
  model?: string;
  enablePunctuationPrediction?: boolean;
  enableWordTimeOffsets?: boolean;
}

export interface NimSpeechResult {
  text: string;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
}

export interface NimLlmOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface NimLlmResponse {
  text: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class NvidiaNimClient {
  private apiKey: string;
  private baseUrl: string;
  private llmUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.NVIDIA_NIM_API_KEY || '';
    this.baseUrl = baseUrl || process.env.NVIDIA_NIM_BASE_URL || 'https://api.nvcf.nvidia.com/v2/nvcf';
    this.llmUrl = process.env.NVIDIA_LLM_NIM_URL || 'https://integrate.api.nvidia.com/v1';
    
    if (!this.apiKey) {
      throw new Error('NVIDIA NIM API key is required');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA NIM API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  private async makeLlmRequest(endpoint: string, options: any = {}) {
    const url = `${this.llmUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA LLM API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Convert audio to text using NVIDIA NIM ASR
   */
  async speechToText(
    audioData: Blob | ArrayBuffer | string, 
    options: NimSpeechToTextOptions = {}
  ): Promise<NimSpeechResult> {
    const {
      language = 'en',
      model = process.env.NVIDIA_ASR_MODEL || 'nvidia/parakeet-ctc-1.1b',
      enablePunctuationPrediction = true,
      enableWordTimeOffsets = true,
    } = options;

    let audioBase64: string;
    
    if (typeof audioData === 'string') {
      audioBase64 = audioData;
    } else if (audioData instanceof Blob) {
      const arrayBuffer = await audioData.arrayBuffer();
      audioBase64 = this.arrayBufferToBase64(arrayBuffer);
    } else {
      audioBase64 = this.arrayBufferToBase64(audioData);
    }

    const requestBody = {
      audio: audioBase64,
      language,
      model,
      enable_punctuation_prediction: enablePunctuationPrediction,
      enable_word_time_offsets: enableWordTimeOffsets,
    };

    const response = await this.makeRequest('/audio/transcriptions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return {
      text: response.text || '',
      confidence: response.confidence || 0,
      words: response.words || [],
      alternatives: response.alternatives || [],
    };
  }

  /**
   * Generate text using NVIDIA LLM API
   */
  async generateText(
    prompt: string,
    options: NimLlmOptions = {}
  ): Promise<NimLlmResponse> {
    const {
      model = process.env.NVIDIA_LLM_MODEL || 'meta/llama-3.1-70b-instruct',
      temperature = 0.7,
      maxTokens = 1024,
      topP = 0.9,
    } = options;

    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: false,
    };

    const response = await this.makeLlmRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const choice = response.choices?.[0];
    return {
      text: choice?.message?.content || '',
      finishReason: choice?.finish_reason || 'unknown',
      usage: response.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  /**
   * Generate meeting summary from transcript
   */
  async generateMeetingSummary(transcript: string): Promise<string> {
    const prompt = `
Please analyze the following meeting transcript and provide a comprehensive summary including:

1. **Key Discussion Points**: Main topics discussed
2. **Decisions Made**: Any decisions or conclusions reached
3. **Action Items**: Tasks assigned or next steps identified
4. **Participants**: Key contributors and their roles in the discussion
5. **Follow-up**: Any items requiring future attention

Please format the summary in a clear, professional manner suitable for sharing with stakeholders.

Transcript:
${transcript}

Summary:`;

    const response = await this.generateText(prompt, {
      temperature: 0.3, // Lower temperature for more focused summaries
      maxTokens: 2048,
    });

    return response.text;
  }

  /**
   * Extract action items from meeting transcript
   */
  async extractActionItems(transcript: string): Promise<string[]> {
    const prompt = `
Analyze the following meeting transcript and extract all action items, tasks, and next steps mentioned.
Return only a JSON array of strings, each representing a specific action item.
Be specific and include who is responsible if mentioned.

Example format: ["John to prepare sales report by Friday", "Schedule follow-up meeting with client", "Review budget proposals before next week"]

Transcript:
${transcript}

Action Items (JSON array only):`;

    const response = await this.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 1024,
    });

    try {
      const actionItems = JSON.parse(response.text);
      return Array.isArray(actionItems) ? actionItems : [];
    } catch (error) {
      console.error('Failed to parse action items:', error);
      // Fallback: try to extract items manually
      const lines = response.text.split('\n').filter(line => 
        line.trim().length > 0 && (line.includes('to ') || line.includes('will ') || line.includes('should '))
      );
      return lines.map(line => line.replace(/^[-*•]\s*/, '').trim());
    }
  }

  /**
   * Generate intelligent captions with context awareness
   */
  async enhanceCaptions(
    rawText: string, 
    context: string = '',
    previousCaptions: string[] = []
  ): Promise<string> {
    const contextPrompt = context ? `Context: ${context}\n` : '';
    const historyPrompt = previousCaptions.length > 0 
      ? `Previous captions: ${previousCaptions.slice(-3).join(' ')}\n` 
      : '';

    const prompt = `
${contextPrompt}${historyPrompt}
Improve the following speech-to-text caption by:
1. Correcting any obvious speech recognition errors
2. Adding proper punctuation and capitalization
3. Ensuring grammatical correctness
4. Maintaining the speaker's original meaning and tone
5. Keeping it concise and readable for live captions

Raw text: "${rawText}"

Improved caption:`;

    const response = await this.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 256,
    });

    return response.text.trim();
  }

  /**
   * Utility method to convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// Singleton instance for client-side usage
let nimClientInstance: NvidiaNimClient | null = null;

export function getNimClient(): NvidiaNimClient {
  if (!nimClientInstance) {
    nimClientInstance = new NvidiaNimClient();
  }
  return nimClientInstance;
}

// Server-side factory function
export function createNimClient(apiKey?: string, baseUrl?: string): NvidiaNimClient {
  return new NvidiaNimClient(apiKey, baseUrl);
}