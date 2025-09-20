// components/captions/UnifiedCaptions.tsx
'use client';

import { useState, useEffect } from 'react';
import LiveCaptions from './LiveCaptions';
import LiveCaptionsAI from './LiveCaptionsAI';
import CaptionModeToggle from './CaptionModeToggle';
import WorkingSentimentMonitor from '../sentiment/WorkingSentimentMonitor';
import { SentimentProvider } from '@/contexts/SentimentContext';

interface UnifiedCaptionsProps {
  defaultMode?: 'standard' | 'ai';
  allowModeSwitch?: boolean;
  enableSentimentAnalysis?: boolean;
}

export default function UnifiedCaptions({
  defaultMode = 'ai',
  allowModeSwitch = true,
  enableSentimentAnalysis = true,
}: UnifiedCaptionsProps) {
  const [captionMode, setCaptionMode] = useState<'standard' | 'ai'>(defaultMode);
  const [isSupported, setIsSupported] = useState(false);

  // Check browser compatibility
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                              (window as any).SpeechRecognition;
    
    setIsSupported(!!(isSecure && SpeechRecognition));
  }, []);

  if (!isSupported) {
    return null;
  }

  const content = (
    <div className="flex items-center gap-2">
      {allowModeSwitch && (
        <CaptionModeToggle
          currentMode={captionMode}
          onModeChange={setCaptionMode}
        />
      )}
      
      {/* Conditionally render the appropriate caption component */}
      {captionMode === 'ai' ? (
        <LiveCaptionsAI enableAI={true} />
      ) : (
        <LiveCaptions />
      )}

      {/* Sentiment Analysis Monitor */}
      {enableSentimentAnalysis && (
        <WorkingSentimentMonitor />
      )}
    </div>
  );

  // Wrap with SentimentProvider if sentiment analysis is enabled
  if (enableSentimentAnalysis) {
    return (
      <SentimentProvider>
        {content}
      </SentimentProvider>
    );
  }

  return content;
}