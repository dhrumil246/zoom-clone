// hooks/useNimCaptions.ts
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useCaptions } from './useCaptions';
import { 
  EnhancedTranscriptEntry, 
  NimCaptionSession, 
  NimCaptionSettings,
  NimApiResponse 
} from '@/lib/captions/nvidia-types';
import { TranscriptEntry } from '@/lib/captions/types';

interface UseNimCaptionsOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  nimSettings?: Partial<NimCaptionSettings>;
}

interface UseNimCaptionsReturn {
  // All original caption functionality
  isListening: boolean;
  transcript: EnhancedTranscriptEntry[];
  currentSession: NimCaptionSession | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  clearTranscript: () => void;
  downloadTranscript: (format: 'text' | 'srt' | 'webvtt') => void;
  sessions: NimCaptionSession[];
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  
  // NVIDIA NIM enhanced features
  nimSettings: NimCaptionSettings;
  updateNimSettings: (settings: Partial<NimCaptionSettings>) => void;
  generateSummary: () => Promise<void>;
  extractActionItems: () => Promise<void>;
  enhanceCaption: (entryId: string) => Promise<void>;
  isProcessingNim: boolean;
  nimProcessingQueue: string[];
}

const defaultNimSettings: NimCaptionSettings = {
  enableNvidiaEnhancement: true,
  enhanceOnlyFinalCaptions: true,
  useContextAwareness: true,
  autoGenerateSummary: false,
  extractActionItems: false,
  confidenceThreshold: 0.7,
};

export function useNimCaptions(options: UseNimCaptionsOptions = {}): UseNimCaptionsReturn {
  const { nimSettings: nimSettingsOverride, ...captionOptions } = options;
  
  // Use the original captions hook
  const originalCaptions = useCaptions(captionOptions);
  
  // NVIDIA NIM specific state
  const [nimSettings, setNimSettings] = useState<NimCaptionSettings>({
    ...defaultNimSettings,
    ...nimSettingsOverride,
  });
  
  const [enhancedTranscript, setEnhancedTranscript] = useState<EnhancedTranscriptEntry[]>([]);
  const [currentNimSession, setCurrentNimSession] = useState<NimCaptionSession | null>(null);
  const [nimSessions, setNimSessions] = useState<NimCaptionSession[]>([]);
  const [isProcessingNim, setIsProcessingNim] = useState(false);
  const [nimProcessingQueue, setNimProcessingQueue] = useState<string[]>([]);
  
  const processedEntries = useRef<Set<string>>(new Set());
  const contextCache = useRef<string[]>([]);

  // Convert regular transcript entries to enhanced entries
  const convertToEnhanced = useCallback((entry: TranscriptEntry): EnhancedTranscriptEntry => {
    const entryId = `${entry.timestamp.getTime()}_${entry.text.substring(0, 20)}`;
    
    return {
      ...entry,
      originalText: entry.text,
      processingStatus: 'pending',
      enhancedText: undefined,
      nimConfidence: undefined,
    };
  }, []);

  // Update enhanced transcript when original transcript changes
  useEffect(() => {
    const newEnhanced = originalCaptions.transcript.map(convertToEnhanced);
    setEnhancedTranscript(newEnhanced);
    
    // Process new final entries if auto-enhancement is enabled
    if (nimSettings.enableNvidiaEnhancement) {
      const newFinalEntries = newEnhanced.filter(entry => {
        const entryId = `${entry.timestamp.getTime()}_${entry.originalText.substring(0, 20)}`;
        return entry.isFinal && 
               !processedEntries.current.has(entryId) &&
               entry.confidence !== undefined &&
               entry.confidence >= nimSettings.confidenceThreshold;
      });

      newFinalEntries.forEach(entry => {
        const entryId = `${entry.timestamp.getTime()}_${entry.originalText.substring(0, 20)}`;
        if (nimSettings.enhanceOnlyFinalCaptions) {
          enhanceCaption(entryId);
        }
      });
    }
  }, [originalCaptions.transcript, nimSettings, convertToEnhanced]);

  // Update NIM session when original session changes
  useEffect(() => {
    if (originalCaptions.currentSession) {
      const nimSession: NimCaptionSession = {
        ...originalCaptions.currentSession,
        transcript: enhancedTranscript,
        nimProcessed: false,
        enhancementSettings: {
          enableNimEnhancement: nimSettings.enableNvidiaEnhancement,
          enhanceOnFinal: nimSettings.enhanceOnlyFinalCaptions,
          contextAware: nimSettings.useContextAwareness,
        },
      };
      setCurrentNimSession(nimSession);
    } else {
      setCurrentNimSession(null);
    }
  }, [originalCaptions.currentSession, enhancedTranscript, nimSettings]);

  // API call helpers
  const callNimApi = useCallback(async <T>(
    endpoint: string, 
    data: any
  ): Promise<T> => {
    const response = await fetch(`/api/nvidia-nim/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API call failed: ${response.status}`);
    }

    const result: NimApiResponse<T> = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.result;
  }, []);

  // Enhance a specific caption entry
  const enhanceCaption = useCallback(async (entryId: string): Promise<void> => {
    if (nimProcessingQueue.includes(entryId)) return;
    
    setNimProcessingQueue(prev => [...prev, entryId]);
    setIsProcessingNim(true);

    try {
      const entry = enhancedTranscript.find(e => 
        `${e.timestamp.getTime()}_${e.originalText.substring(0, 20)}` === entryId
      );

      if (!entry) {
        throw new Error('Entry not found');
      }

      // Update status to processing
      setEnhancedTranscript(prev => prev.map(e => 
        `${e.timestamp.getTime()}_${e.originalText.substring(0, 20)}` === entryId
          ? { ...e, processingStatus: 'processing' as const }
          : e
      ));

      const context = nimSettings.useContextAwareness 
        ? `Meeting context: ${currentNimSession?.name || 'Video meeting'}`
        : '';

      const previousCaptions = nimSettings.useContextAwareness
        ? contextCache.current.slice(-3)
        : [];

      const enhancedText = await callNimApi<string>('enhance-captions', {
        rawText: entry.originalText,
        context,
        previousCaptions,
      });

      // Update the entry with enhanced text
      setEnhancedTranscript(prev => prev.map(e => {
        const currentEntryId = `${e.timestamp.getTime()}_${e.originalText.substring(0, 20)}`;
        if (currentEntryId === entryId) {
          return {
            ...e,
            enhancedText,
            processingStatus: 'enhanced' as const,
            nimConfidence: 0.95, // High confidence for NIM processing
          };
        }
        return e;
      }));

      // Update context cache
      if (nimSettings.useContextAwareness) {
        contextCache.current = [...contextCache.current, enhancedText].slice(-10);
      }

      processedEntries.current.add(entryId);

    } catch (error) {
      console.error('Caption enhancement error:', error);
      
      // Update status to error
      setEnhancedTranscript(prev => prev.map(e => 
        `${e.timestamp.getTime()}_${e.originalText.substring(0, 20)}` === entryId
          ? { ...e, processingStatus: 'error' as const }
          : e
      ));
    } finally {
      setNimProcessingQueue(prev => prev.filter(id => id !== entryId));
      setIsProcessingNim(prev => nimProcessingQueue.length > 1);
    }
  }, [enhancedTranscript, nimSettings, currentNimSession, callNimApi, nimProcessingQueue]);

  // Generate meeting summary
  const generateSummary = useCallback(async (): Promise<void> => {
    if (!currentNimSession || enhancedTranscript.length === 0) {
      throw new Error('No transcript available for summary');
    }

    setIsProcessingNim(true);

    try {
      const transcriptText = enhancedTranscript
        .filter(entry => entry.isFinal)
        .map(entry => entry.enhancedText || entry.originalText)
        .join('\n');

      const summary = await callNimApi<string>('summarize', {
        transcript: transcriptText,
        type: 'summary',
      });

      setCurrentNimSession(prev => prev ? {
        ...prev,
        summary,
        nimProcessed: true,
      } : null);

    } catch (error) {
      console.error('Summary generation error:', error);
      throw error;
    } finally {
      setIsProcessingNim(false);
    }
  }, [currentNimSession, enhancedTranscript, callNimApi]);

  // Extract action items
  const extractActionItems = useCallback(async (): Promise<void> => {
    if (!currentNimSession || enhancedTranscript.length === 0) {
      throw new Error('No transcript available for action item extraction');
    }

    setIsProcessingNim(true);

    try {
      const transcriptText = enhancedTranscript
        .filter(entry => entry.isFinal)
        .map(entry => entry.enhancedText || entry.originalText)
        .join('\n');

      const actionItems = await callNimApi<string[]>('summarize', {
        transcript: transcriptText,
        type: 'action-items',
      });

      setCurrentNimSession(prev => prev ? {
        ...prev,
        actionItems,
        nimProcessed: true,
      } : null);

    } catch (error) {
      console.error('Action items extraction error:', error);
      throw error;
    } finally {
      setIsProcessingNim(false);
    }
  }, [currentNimSession, enhancedTranscript, callNimApi]);

  // Update NIM settings
  const updateNimSettings = useCallback((newSettings: Partial<NimCaptionSettings>) => {
    setNimSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Auto-generate summary and action items when session ends
  useEffect(() => {
    if (!originalCaptions.isListening && currentNimSession && enhancedTranscript.length > 0) {
      if (nimSettings.autoGenerateSummary) {
        generateSummary().catch(console.error);
      }
      if (nimSettings.extractActionItems) {
        extractActionItems().catch(console.error);
      }
    }
  }, [originalCaptions.isListening, nimSettings.autoGenerateSummary, nimSettings.extractActionItems]);

  return {
    // Original caption functionality with enhanced data
    isListening: originalCaptions.isListening,
    transcript: enhancedTranscript,
    currentSession: currentNimSession,
    error: originalCaptions.error,
    startListening: originalCaptions.startListening,
    stopListening: originalCaptions.stopListening,
    pauseListening: originalCaptions.pauseListening,
    resumeListening: originalCaptions.resumeListening,
    clearTranscript: originalCaptions.clearTranscript,
    downloadTranscript: originalCaptions.downloadTranscript,
    sessions: nimSessions,
    loadSession: originalCaptions.loadSession,
    deleteSession: originalCaptions.deleteSession,

    // NVIDIA NIM enhanced features
    nimSettings,
    updateNimSettings,
    generateSummary,
    extractActionItems,
    enhanceCaption,
    isProcessingNim,
    nimProcessingQueue,
  };
}