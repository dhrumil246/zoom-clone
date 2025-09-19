// lib/captions/nvidia-types.ts

import { TranscriptEntry, CaptionSession } from './types';

export interface EnhancedTranscriptEntry extends TranscriptEntry {
  enhancedText?: string;
  nimConfidence?: number;
  processingStatus: 'pending' | 'processing' | 'enhanced' | 'error';
  originalText: string;
}

export interface NimCaptionSession extends CaptionSession {
  transcript: EnhancedTranscriptEntry[];
  summary?: string;
  actionItems?: string[];
  nimProcessed: boolean;
  enhancementSettings: {
    enableNimEnhancement: boolean;
    enhanceOnFinal: boolean;
    contextAware: boolean;
  };
}

export interface NimCaptionSettings {
  enableNvidiaEnhancement: boolean;
  enhanceOnlyFinalCaptions: boolean;
  useContextAwareness: boolean;
  autoGenerateSummary: boolean;
  extractActionItems: boolean;
  confidenceThreshold: number;
}

export interface NimApiResponse<T> {
  result: T;
  error?: string;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  duration: number;
}