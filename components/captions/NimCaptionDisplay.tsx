// components/captions/NimCaptionDisplay.tsx
'use client';

import React from 'react';
import { EnhancedTranscriptEntry } from '@/lib/captions/nvidia-types';
import { cn } from '@/lib/utils';

interface NimCaptionDisplayProps {
  transcript: EnhancedTranscriptEntry[];
  isListening: boolean;
  className?: string;
  showConfidence?: boolean;
  showProcessingStatus?: boolean;
  maxDisplayEntries?: number;
}

export function NimCaptionDisplay({
  transcript,
  isListening,
  className,
  showConfidence = false,
  showProcessingStatus = true,
  maxDisplayEntries = 10,
}: NimCaptionDisplayProps) {
  // Show only recent entries for better performance
  const displayTranscript = transcript.slice(-maxDisplayEntries);

  const getDisplayText = (entry: EnhancedTranscriptEntry): string => {
    // Prefer enhanced text, fallback to original
    return entry.enhancedText || entry.text;
  };

  const getEntryStatusColor = (entry: EnhancedTranscriptEntry): string => {
    if (!entry.isFinal) return 'text-gray-400';
    
    switch (entry.processingStatus) {
      case 'enhanced':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getConfidenceIndicator = (entry: EnhancedTranscriptEntry): string => {
    const confidence = entry.nimConfidence || entry.confidence || 0;
    if (confidence >= 0.9) return '🟢';
    if (confidence >= 0.7) return '🟡';
    return '🔴';
  };

  return (
    <div className={cn(
      "bg-black bg-opacity-80 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          Live Captions (NVIDIA Enhanced)
        </h3>
        {isListening && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">Recording</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {displayTranscript.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {isListening ? 'Listening for speech...' : 'No captions yet'}
          </div>
        ) : (
          displayTranscript.map((entry, index) => (
            <div
              key={`${entry.timestamp.getTime()}_${index}`}
              className={cn(
                "p-3 rounded-md transition-all duration-200",
                entry.isFinal 
                  ? "bg-gray-800 bg-opacity-60" 
                  : "bg-gray-700 bg-opacity-40",
                !entry.isFinal && "italic"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={cn(
                    "text-sm leading-relaxed",
                    getEntryStatusColor(entry)
                  )}>
                    {entry.speaker && (
                      <span className="font-medium text-blue-400 mr-2">
                        {entry.speaker}:
                      </span>
                    )}
                    {getDisplayText(entry)}
                  </p>
                  
                  {showProcessingStatus && entry.isFinal && (
                    <div className="flex items-center gap-2 mt-1">
                      {entry.processingStatus === 'processing' && (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-yellow-400">
                            Enhancing...
                          </span>
                        </div>
                      )}
                      
                      {entry.processingStatus === 'enhanced' && (
                        <span className="text-xs text-green-400">
                          ✨ AI Enhanced
                        </span>
                      )}
                      
                      {entry.processingStatus === 'error' && (
                        <span className="text-xs text-red-400">
                          ❌ Enhancement failed
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                  
                  {showConfidence && (entry.confidence || entry.nimConfidence) && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">
                        {getConfidenceIndicator(entry)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round((entry.nimConfidence || entry.confidence || 0) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {transcript.filter(e => e.isFinal).length} final captions
          </span>
          <span>
            {transcript.filter(e => e.processingStatus === 'enhanced').length} enhanced by AI
          </span>
        </div>
      </div>
    </div>
  );
}