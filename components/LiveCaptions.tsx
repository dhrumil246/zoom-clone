'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  speaker: string;
  confidence?: number;
}

interface LiveCaptionsProps {
  className?: string;
}

export default function LiveCaptions({ className }: LiveCaptionsProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [settings, setSettings] = useState({
    fontSize: 16,
    maxCaptions: 5,
    showTimestamps: true,
    autoHide: false
  });

  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening
  } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        // Add final caption
        const newCaption: Caption = {
          id: Date.now().toString(),
          text: transcript.trim(),
          timestamp: new Date(),
          speaker: 'You',
          confidence: 0.95
        };
        
        setCaptions(prev => {
          const updated = [newCaption, ...prev];
          return updated.slice(0, settings.maxCaptions);
        });
        
        // Clear current transcript
        setCurrentTranscript('');
      } else {
        // Update current transcript
        setCurrentTranscript(transcript);
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    }
  });

  // Auto-start if enabled
  useEffect(() => {
    if (isEnabled && isSupported && !isListening) {
      const timer = setTimeout(() => {
        startListening();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, isSupported]);

  if (!isSupported) {
    return (
      <div className={cn("fixed bottom-20 left-4 right-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3", className)}>
        <p className="text-red-400 text-sm text-center">
          Speech recognition is not supported in this browser. Try using Chrome or Edge.
        </p>
      </div>
    );
  }

  if (!isEnabled) return null;

  return (
    <div className={cn("fixed bottom-20 left-4 right-4 z-40", className)}>
      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Button
          onClick={toggleListening}
          className={cn(
            "rounded-full w-12 h-12 transition-all duration-300",
            isListening 
              ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-600/30" 
              : "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30"
          )}
          title={isListening ? "Stop Live Captions" : "Start Live Captions"}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        
        <Badge 
          variant={isListening ? "default" : "secondary"} 
          className={cn(
            "px-3 py-1",
            isListening ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"
          )}
        >
          {isListening ? "Live Captions ON" : "Live Captions OFF"}
        </Badge>

        <Button
          onClick={() => setIsEnabled(false)}
          variant="outline"
          size="sm"
          className="rounded-full w-8 h-8 p-0"
          title="Hide Captions"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Current Live Transcript */}
      {currentTranscript && isListening && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mb-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-400 text-xs font-medium">Speaking...</span>
          </div>
          <p 
            className="text-white leading-relaxed"
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            "{currentTranscript}"
          </p>
        </div>
      )}

      {/* Recent Captions */}
      {captions.length > 0 && (
        <div className="space-y-2">
          {captions.map((caption, index) => (
            <div
              key={caption.id}
              className={cn(
                "bg-gray-900/90 border border-gray-700/50 rounded-lg p-3 backdrop-blur-sm transition-all duration-300",
                index === 0 ? "border-green-500/30 bg-green-900/20" : ""
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs font-medium">
                    {caption.speaker}
                  </span>
                  {settings.showTimestamps && (
                    <span className="text-gray-500 text-xs">
                      {caption.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                  {caption.confidence && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {Math.round(caption.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                {index === 0 && (
                  <Badge variant="outline" className="text-xs px-1 py-0 text-green-400 border-green-400">
                    Latest
                  </Badge>
                )}
              </div>
              <p 
                className="text-white leading-relaxed"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                {caption.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mt-2">
          <p className="text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Quick Settings */}
      <div className="flex items-center justify-center mt-3 gap-2">
        <Button
          onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 2) }))}
          variant="outline"
          size="sm"
          className="text-xs px-2 py-1"
        >
          A-
        </Button>
        <span className="text-gray-400 text-xs">{settings.fontSize}px</span>
        <Button
          onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.min(24, prev.fontSize + 2) }))}
          variant="outline"
          size="sm"
          className="text-xs px-2 py-1"
        >
          A+
        </Button>
        
        <Button
          onClick={() => setCaptions([])}
          variant="outline"
          size="sm"
          className="text-xs px-2 py-1 ml-4"
        >
          Clear
        </Button>
        
        <Button
          onClick={() => setSettings(prev => ({ ...prev, showTimestamps: !prev.showTimestamps }))}
          variant="outline"
          size="sm"
          className="text-xs px-2 py-1"
        >
          {settings.showTimestamps ? "Hide Time" : "Show Time"}
        </Button>
      </div>
    </div>
  );
}