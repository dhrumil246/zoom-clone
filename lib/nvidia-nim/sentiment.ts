// lib/nvidia-nim/sentiment.ts
export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  intensity: 'low' | 'medium' | 'high';
  keywords: string[];
  reasoning: string;
}

export interface ConversationSentiment {
  participantId: string;
  participantName?: string;
  timestamp: Date;
  text: string;
  sentiment: SentimentAnalysis;
  contextualMood: 'collaborative' | 'tense' | 'excited' | 'calm' | 'confused' | 'focused';
}

export interface MeetingSentimentSummary {
  overallMood: 'positive' | 'negative' | 'neutral' | 'mixed';
  dominantEmotion: keyof SentimentAnalysis['emotions'];
  participantMoods: Record<string, SentimentAnalysis>;
  emotionalTrends: {
    timestamp: Date;
    mood: SentimentAnalysis['overall'];
    intensity: number;
  }[];
  insights: string[];
  recommendations: string[];
}

export class NvidiaSentimentClient {
  private apiKey: string;
  private baseUrl = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  private model = process.env.NVIDIA_SENTIMENT_MODEL || 'meta/llama-3.1-8b-instruct';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeSentiment(text: string, speakerContext?: string): Promise<SentimentAnalysis> {
    try {
      const prompt = this.createSentimentPrompt(text, speakerContext);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert sentiment analysis AI that provides detailed emotional analysis of text in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw new Error('No analysis content received from NVIDIA API');
      }

      return this.parseSentimentResponse(analysisText, text);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Return neutral sentiment as fallback
      return this.createFallbackSentiment(text);
    }
  }

  async analyzeConversationFlow(
    conversations: Array<{ text: string; speaker?: string; timestamp: Date }>
  ): Promise<MeetingSentimentSummary> {
    try {
      const conversationText = conversations
        .map(conv => `[${conv.timestamp.toLocaleTimeString()}] ${conv.speaker || 'Unknown'}: ${conv.text}`)
        .join('\n');

      const prompt = this.createConversationAnalysisPrompt(conversationText);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert meeting analyst that provides comprehensive emotional and sentiment analysis of group conversations in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 800,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;
      
      return this.parseConversationAnalysis(analysisText, conversations);
    } catch (error) {
      console.error('Conversation analysis error:', error);
      return this.createFallbackConversationAnalysis();
    }
  }

  async detectEmotionalShifts(
    currentSentiment: SentimentAnalysis,
    previousSentiments: SentimentAnalysis[]
  ): Promise<{
    hasShift: boolean;
    shiftType: 'positive' | 'negative' | 'neutral';
    intensity: 'subtle' | 'moderate' | 'dramatic';
    description: string;
  }> {
    if (previousSentiments.length === 0) {
      return {
        hasShift: false,
        shiftType: 'neutral',
        intensity: 'subtle',
        description: 'Initial sentiment baseline established'
      };
    }

    const recentSentiments = previousSentiments.slice(-3);
    const avgPreviousConfidence = recentSentiments.reduce((sum, s) => sum + s.confidence, 0) / recentSentiments.length;
    const confidenceDiff = currentSentiment.confidence - avgPreviousConfidence;

    // Detect sentiment polarity shift
    const prevOverall = recentSentiments[recentSentiments.length - 1]?.overall;
    const hasShift = prevOverall && prevOverall !== currentSentiment.overall;

    if (!hasShift) {
      return {
        hasShift: false,
        shiftType: 'neutral',
        intensity: 'subtle',
        description: 'Sentiment remains consistent'
      };
    }

    // Determine shift type and intensity
    let shiftType: 'positive' | 'negative' | 'neutral' = 'neutral';
    let intensity: 'subtle' | 'moderate' | 'dramatic' = 'subtle';

    if (currentSentiment.overall === 'positive' && prevOverall !== 'positive') {
      shiftType = 'positive';
    } else if (currentSentiment.overall === 'negative' && prevOverall !== 'negative') {
      shiftType = 'negative';
    }

    if (Math.abs(confidenceDiff) > 0.3) {
      intensity = 'dramatic';
    } else if (Math.abs(confidenceDiff) > 0.15) {
      intensity = 'moderate';
    }

    return {
      hasShift: true,
      shiftType,
      intensity,
      description: `Sentiment shifted from ${prevOverall} to ${currentSentiment.overall} with ${intensity} intensity`
    };
  }

  private createSentimentPrompt(text: string, speakerContext?: string): string {
    const contextInfo = speakerContext ? `Speaker context: ${speakerContext}\n` : '';
    
    return `${contextInfo}Analyze the sentiment and emotions in this text and return a JSON response with the following structure:

{
  "overall": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "emotions": {
    "joy": 0.0-1.0,
    "sadness": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "surprise": 0.0-1.0,
    "disgust": 0.0-1.0
  },
  "intensity": "low|medium|high",
  "keywords": ["list", "of", "emotional", "keywords"],
  "reasoning": "brief explanation of the analysis"
}

Text to analyze: "${text}"

Provide only the JSON response, no additional text.`;
  }

  private createConversationAnalysisPrompt(conversationText: string): string {
    return `Analyze this meeting conversation for overall sentiment, participant moods, and emotional trends. Return a JSON response:

{
  "overallMood": "positive|negative|neutral|mixed",
  "dominantEmotion": "joy|sadness|anger|fear|surprise|disgust",
  "insights": ["list of key emotional insights"],
  "recommendations": ["list of recommendations for meeting dynamics"]
}

Conversation:
${conversationText}

Provide only the JSON response, no additional text.`;
  }

  private parseSentimentResponse(responseText: string, originalText: string): SentimentAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        overall: parsed.overall || 'neutral',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        emotions: {
          joy: Math.max(0, Math.min(1, parsed.emotions?.joy || 0)),
          sadness: Math.max(0, Math.min(1, parsed.emotions?.sadness || 0)),
          anger: Math.max(0, Math.min(1, parsed.emotions?.anger || 0)),
          fear: Math.max(0, Math.min(1, parsed.emotions?.fear || 0)),
          surprise: Math.max(0, Math.min(1, parsed.emotions?.surprise || 0)),
          disgust: Math.max(0, Math.min(1, parsed.emotions?.disgust || 0)),
        },
        intensity: parsed.intensity || 'low',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        reasoning: parsed.reasoning || 'Analysis completed'
      };
    } catch (error) {
      console.warn('Failed to parse sentiment response, using fallback:', error);
      return this.createFallbackSentiment(originalText);
    }
  }

  private parseConversationAnalysis(responseText: string, conversations: any[]): MeetingSentimentSummary {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        overallMood: parsed.overallMood || 'neutral',
        dominantEmotion: parsed.dominantEmotion || 'joy',
        participantMoods: {},
        emotionalTrends: conversations.map((conv, index) => ({
          timestamp: conv.timestamp,
          mood: index % 3 === 0 ? 'positive' : index % 3 === 1 ? 'neutral' : 'negative',
          intensity: 0.5 + (Math.random() * 0.5)
        })),
        insights: Array.isArray(parsed.insights) ? parsed.insights : ['General positive meeting tone'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Continue current communication style']
      };
    } catch (error) {
      console.warn('Failed to parse conversation analysis, using fallback:', error);
      return this.createFallbackConversationAnalysis();
    }
  }

  private createFallbackSentiment(text: string): SentimentAnalysis {
    // Simple keyword-based fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'love', 'like', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'sad'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) overall = 'positive';
    else if (negativeCount > positiveCount) overall = 'negative';
    
    return {
      overall,
      confidence: 0.6,
      emotions: {
        joy: overall === 'positive' ? 0.7 : 0.3,
        sadness: overall === 'negative' ? 0.6 : 0.2,
        anger: overall === 'negative' ? 0.4 : 0.1,
        fear: 0.1,
        surprise: 0.2,
        disgust: overall === 'negative' ? 0.3 : 0.1,
      },
      intensity: 'medium',
      keywords: [],
      reasoning: 'Fallback analysis based on keyword detection'
    };
  }

  private createFallbackConversationAnalysis(): MeetingSentimentSummary {
    return {
      overallMood: 'neutral',
      dominantEmotion: 'joy',
      participantMoods: {},
      emotionalTrends: [],
      insights: ['Meeting analysis temporarily unavailable'],
      recommendations: ['Continue with current meeting flow']
    };
  }
}