// hooks/useSentimentAnalysis.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SentimentAnalysis, 
  ConversationSentiment, 
  MeetingSentimentSummary,
  NvidiaSentimentClient 
} from '@/lib/nvidia-nim/sentiment';

export interface SentimentSettings {
  enableRealTimeAnalysis: boolean;
  analysisFrequency: number; // seconds between analyses
  emotionalShiftAlerts: boolean;
  confidenceThreshold: number;
  analyzeOnlyFinalTranscripts: boolean;
  trackParticipantMoods: boolean;
}

export interface SentimentState {
  currentSentiment: SentimentAnalysis | null;
  conversationHistory: ConversationSentiment[];
  meetingSummary: MeetingSentimentSummary | null;
  isAnalyzing: boolean;
  error: string | null;
  emotionalAlerts: Array<{
    id: string;
    type: 'positive_shift' | 'negative_shift' | 'high_tension' | 'mood_drop';
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface UseSentimentAnalysisProps {
  settings: SentimentSettings;
  onSentimentChange?: (sentiment: SentimentAnalysis) => void;
  onEmotionalAlert?: (alert: SentimentState['emotionalAlerts'][0]) => void;
}

export function useSentimentAnalysis({
  settings,
  onSentimentChange,
  onEmotionalAlert,
}: UseSentimentAnalysisProps) {
  const [state, setState] = useState<SentimentState>({
    currentSentiment: null,
    conversationHistory: [],
    meetingSummary: null,
    isAnalyzing: false,
    error: null,
    emotionalAlerts: [],
  });

  const sentimentClient = useRef<NvidiaSentimentClient | null>(null);
  const analysisQueue = useRef<Array<{ text: string; speaker?: string; timestamp: Date }>>([]);
  const lastAnalysisTime = useRef<Date>(new Date());
  const sentimentHistory = useRef<SentimentAnalysis[]>([]);

  // Initialize sentiment client
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_NVIDIA_API_KEY || '';
    if (apiKey && !sentimentClient.current) {
      sentimentClient.current = new NvidiaSentimentClient(apiKey);
    }
  }, []);

  // Process sentiment analysis
  const analyzeText = useCallback(async (
    text: string, 
    speaker?: string, 
    timestamp: Date = new Date()
  ): Promise<SentimentAnalysis | null> => {
    if (!sentimentClient.current || !settings.enableRealTimeAnalysis) {
      return null;
    }

    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
      
      const sentiment = await sentimentClient.current.analyzeSentiment(text, speaker);
      
      // Check for emotional shifts
      if (settings.emotionalShiftAlerts && sentimentHistory.current.length > 0) {
        const shiftAnalysis = await sentimentClient.current.detectEmotionalShifts(
          sentiment,
          sentimentHistory.current
        );
        
        if (shiftAnalysis.hasShift && shiftAnalysis.intensity !== 'subtle') {
          const alert = {
            id: `alert_${Date.now()}`,
            type: shiftAnalysis.shiftType === 'positive' ? 'positive_shift' as const : 'negative_shift' as const,
            message: shiftAnalysis.description,
            timestamp: new Date(),
            severity: shiftAnalysis.intensity === 'dramatic' ? 'high' as const : 'medium' as const,
          };
          
          setState(prev => ({
            ...prev,
            emotionalAlerts: [...prev.emotionalAlerts.slice(-4), alert]
          }));
          
          onEmotionalAlert?.(alert);
        }
      }

      // Store sentiment in history
      sentimentHistory.current = [...sentimentHistory.current.slice(-10), sentiment];
      
      // Create conversation sentiment entry
      const conversationSentiment: ConversationSentiment = {
        participantId: speaker || 'unknown',
        participantName: speaker,
        timestamp,
        text,
        sentiment,
        contextualMood: determineContextualMood(sentiment),
      };

      setState(prev => ({
        ...prev,
        currentSentiment: sentiment,
        conversationHistory: [...prev.conversationHistory.slice(-50), conversationSentiment],
        isAnalyzing: false,
      }));

      onSentimentChange?.(sentiment);
      return sentiment;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      }));
      return null;
    }
  }, [settings, onSentimentChange, onEmotionalAlert]);

  // Queue text for analysis with rate limiting
  const queueAnalysis = useCallback((text: string, speaker?: string) => {
    if (!settings.enableRealTimeAnalysis) return;
    
    const now = new Date();
    const timeSinceLastAnalysis = (now.getTime() - lastAnalysisTime.current.getTime()) / 1000;
    
    // Add to queue
    analysisQueue.current.push({ text, speaker, timestamp: now });
    
    // Process queue if enough time has passed
    if (timeSinceLastAnalysis >= settings.analysisFrequency) {
      processAnalysisQueue();
    }
  }, [settings.analysisFrequency, settings.enableRealTimeAnalysis]);

  // Process queued analyses
  const processAnalysisQueue = useCallback(async () => {
    if (analysisQueue.current.length === 0) return;
    
    const batch = analysisQueue.current.splice(0, 5); // Process in batches
    lastAnalysisTime.current = new Date();
    
    for (const item of batch) {
      await analyzeText(item.text, item.speaker, item.timestamp);
      // Small delay between analyses to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }, [analyzeText]);

  // Generate meeting summary
  const generateMeetingSummary = useCallback(async (): Promise<MeetingSentimentSummary | null> => {
    if (!sentimentClient.current || state.conversationHistory.length === 0) {
      return null;
    }

    try {
      setState(prev => ({ ...prev, isAnalyzing: true }));
      
      const conversations = state.conversationHistory.map(conv => ({
        text: conv.text,
        speaker: conv.participantName,
        timestamp: conv.timestamp,
      }));
      
      const summary = await sentimentClient.current.analyzeConversationFlow(conversations);
      
      setState(prev => ({
        ...prev,
        meetingSummary: summary,
        isAnalyzing: false,
      }));
      
      return summary;
    } catch (error) {
      console.error('Meeting summary error:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Summary generation failed',
      }));
      return null;
    }
  }, [state.conversationHistory]);

  // Get sentiment trends
  const getSentimentTrends = useCallback(() => {
    return state.conversationHistory.map(conv => ({
      timestamp: conv.timestamp,
      sentiment: conv.sentiment.overall,
      confidence: conv.sentiment.confidence,
      intensity: conv.sentiment.intensity,
      dominantEmotion: Object.entries(conv.sentiment.emotions)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as keyof SentimentAnalysis['emotions'],
    }));
  }, [state.conversationHistory]);

  // Get participant mood analysis
  const getParticipantMoods = useCallback(() => {
    const participantMoods: Record<string, {
      averageSentiment: SentimentAnalysis['overall'];
      confidence: number;
      messageCount: number;
      dominantEmotions: string[];
      recentTrend: 'improving' | 'declining' | 'stable';
    }> = {};

    state.conversationHistory.forEach(conv => {
      const participantId = conv.participantId;
      if (!participantMoods[participantId]) {
        participantMoods[participantId] = {
          averageSentiment: 'neutral',
          confidence: 0,
          messageCount: 0,
          dominantEmotions: [],
          recentTrend: 'stable',
        };
      }

      participantMoods[participantId].messageCount++;
      participantMoods[participantId].confidence += conv.sentiment.confidence;
    });

    // Calculate averages and trends
    Object.keys(participantMoods).forEach(participantId => {
      const participant = participantMoods[participantId];
      participant.confidence /= participant.messageCount;
      
      // Determine average sentiment and recent trend
      const participantConversations = state.conversationHistory
        .filter(conv => conv.participantId === participantId);
      
      const recent = participantConversations.slice(-3);
      const earlier = participantConversations.slice(-6, -3);
      
      if (recent.length > 0 && earlier.length > 0) {
        const recentAvg = recent.reduce((sum, conv) => 
          sum + (conv.sentiment.overall === 'positive' ? 1 : conv.sentiment.overall === 'negative' ? -1 : 0), 0
        ) / recent.length;
        
        const earlierAvg = earlier.reduce((sum, conv) => 
          sum + (conv.sentiment.overall === 'positive' ? 1 : conv.sentiment.overall === 'negative' ? -1 : 0), 0
        ) / earlier.length;
        
        if (recentAvg > earlierAvg + 0.2) participant.recentTrend = 'improving';
        else if (recentAvg < earlierAvg - 0.2) participant.recentTrend = 'declining';
      }
    });

    return participantMoods;
  }, [state.conversationHistory]);

  // Clear sentiment data
  const clearSentimentData = useCallback(() => {
    setState({
      currentSentiment: null,
      conversationHistory: [],
      meetingSummary: null,
      isAnalyzing: false,
      error: null,
      emotionalAlerts: [],
    });
    sentimentHistory.current = [];
    analysisQueue.current = [];
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      emotionalAlerts: prev.emotionalAlerts.filter(alert => alert.id !== alertId),
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    analyzeText,
    queueAnalysis,
    generateMeetingSummary,
    clearSentimentData,
    dismissAlert,
    
    // Analytics
    getSentimentTrends,
    getParticipantMoods,
    
    // Computed properties
    hasRecentActivity: state.conversationHistory.length > 0,
    averageMeetingSentiment: state.conversationHistory.length > 0 
      ? state.conversationHistory.reduce((sum, conv) => 
          sum + (conv.sentiment.overall === 'positive' ? 1 : conv.sentiment.overall === 'negative' ? -1 : 0), 0
        ) / state.conversationHistory.length
      : 0,
  };
}

// Helper function to determine contextual mood
function determineContextualMood(sentiment: SentimentAnalysis): ConversationSentiment['contextualMood'] {
  const { emotions, overall, intensity } = sentiment;
  
  if (emotions.anger > 0.6 || emotions.disgust > 0.5) return 'tense';
  if (emotions.joy > 0.7 && intensity === 'high') return 'excited';
  if (emotions.fear > 0.5 || emotions.surprise > 0.6) return 'confused';
  if (overall === 'positive' && emotions.joy > 0.5) return 'collaborative';
  if (overall === 'neutral' && intensity === 'low') return 'calm';
  
  return 'focused';
}