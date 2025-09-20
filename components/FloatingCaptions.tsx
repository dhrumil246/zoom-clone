'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  isEnhanced: boolean;
  isVisible: boolean;
}

interface FloatingCaptionsProps {
  isEnabled: boolean;
  isEnhanced: boolean;
  onTranscriptUpdate: (transcript: string[]) => void;
  onListeningChange?: (isListening: boolean) => void;
}

export default function FloatingCaptions({ 
  isEnabled, 
  isEnhanced, 
  onTranscriptUpdate,
  onListeningChange
}: FloatingCaptionsProps) {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentText, setCurrentText] = useState('');
  const transcriptRef = useRef<string[]>([]);

  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        const newCaption: Caption = {
          id: Date.now().toString(),
          text: isEnhanced ? enhanceText(text) : text,
          timestamp: new Date(),
          isEnhanced,
          isVisible: true
        };

        setCaptions(prev => [newCaption, ...prev.slice(0, 4)]);
        
        // Add to transcript
        transcriptRef.current.push(text);
        onTranscriptUpdate([...transcriptRef.current]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
          setCaptions(current => 
            current.map(cap => 
              cap.id === newCaption.id 
                ? { ...cap, isVisible: false }
                : cap
            )
          );
        }, 3000);

        // Remove from DOM after fade
        setTimeout(() => {
          setCaptions(current => 
            current.filter(cap => cap.id !== newCaption.id)
          );
        }, 3500);
        
        setCurrentText('');
      } else {
        setCurrentText(text);
      }
    },
    onError: (error) => {
      console.warn('Speech recognition error:', error);
    },
    continuous: true,
    interimResults: true
  });

  const enhanceText = (text: string): string => {
    let enhanced = text.trim();
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    if (!/[.!?]$/.test(enhanced)) {
      enhanced += '.';
    }
    
    enhanced = enhanced.replace(/\bi\b/g, 'I');
    enhanced = enhanced.replace(/\bim\b/g, "I'm");
    enhanced = enhanced.replace(/\byou\b/g, 'you');
    
    return enhanced;
  };

  useEffect(() => {
    if (isEnabled && isSupported && !isListening) {
      startListening();
    } else if (!isEnabled && isListening) {
      stopListening();
    }
  }, [isEnabled, isSupported]);

  useEffect(() => {
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

  if (!isEnabled || !isSupported) return null;

  return (
    <div className="fixed top-20 right-4 bottom-32 z-30 w-80 pointer-events-none">
      {/* Listening Status Indicator */}
      {isListening && (
        <div className="mb-2">
          <div className="bg-green-600/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-400/30 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">
                Listening...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current speaking text */}
      {currentText && (
        <div className="mb-2">
          <div className="bg-blue-600/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-400/30 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">
                Speaking...
              </span>
            </div>
            <p className="text-white text-sm mt-1 leading-relaxed">
              "{currentText}"
            </p>
          </div>
        </div>
      )}

      {/* Auto-disappearing captions */}
      <div className="space-y-2">
        {captions.slice(0, 4).map((caption, index) => (
          <div
            key={caption.id}
            className={cn(
              "transition-all duration-500 transform",
              caption.isVisible 
                ? "opacity-100 translate-x-0 scale-100" 
                : "opacity-0 translate-x-4 scale-95"
            )}
          >
            <div className={cn(
              "bg-gray-900/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border",
              caption.isEnhanced 
                ? "border-green-400/30 bg-green-900/20" 
                : "border-gray-600/30",
              index === 0 ? "border-white/40 ring-1 ring-white/20" : ""
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">
                  {caption.timestamp.toLocaleTimeString()}
                </span>
                {caption.isEnhanced && (
                  <span className="text-xs text-green-400 font-medium">AI Enhanced</span>
                )}
              </div>
              <p className="text-white text-sm leading-relaxed">
                {caption.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}