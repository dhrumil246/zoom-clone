// contexts/SentimentContext.tsx
'use client';

import React, { createContext, useContext, useRef } from 'react';

interface SentimentContextType {
  analyzeText: (text: string, speaker?: string) => void;
  registerAnalyzer: (analyzer: (text: string, speaker?: string) => void) => void;
}

const SentimentContext = createContext<SentimentContextType | null>(null);

export function SentimentProvider({ children }: { children: React.ReactNode }) {
  const analyzerRef = useRef<((text: string, speaker?: string) => void) | null>(null);

  const analyzeText = (text: string, speaker?: string) => {
    if (analyzerRef.current) {
      analyzerRef.current(text, speaker);
    }
  };

  const registerAnalyzer = (analyzer: (text: string, speaker?: string) => void) => {
    analyzerRef.current = analyzer;
  };

  return (
    <SentimentContext.Provider value={{ analyzeText, registerAnalyzer }}>
      {children}
    </SentimentContext.Provider>
  );
}

export function useSentimentContext() {
  const context = useContext(SentimentContext);
  if (!context) {
    throw new Error('useSentimentContext must be used within a SentimentProvider');
  }
  return context;
}

export function useOptionalSentimentContext() {
  return useContext(SentimentContext);
}