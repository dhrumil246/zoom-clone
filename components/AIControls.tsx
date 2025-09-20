'use client';

import { useState } from 'react';
import { Brain, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIControlsProps {
  className?: string;
}

export default function AIControls({ className }: AIControlsProps) {
  const [sentiment, setSentiment] = useState<{
    mood: 'positive' | 'negative' | 'neutral';
    confidence: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runSentimentAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: "I'm really excited about this meeting! Everyone is contributing great ideas and we're making excellent progress.",
          speakerContext: 'Meeting Participant'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSentiment({
          mood: result.data.overall,
          confidence: result.data.confidence
        });
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSummary = async () => {
    try {
      const response = await fetch('/api/nvidia-nim/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: "This is a productive meeting with positive collaboration and good engagement from all participants. We discussed the project timeline, budget allocations, and next steps.",
          type: 'summary'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Meeting Summary Generated!\n\n${result.result}`);
      }
    } catch (error) {
      console.error('Summary generation failed:', error);
      alert('Summary generation failed. Please try again.');
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'text-green-400 border-green-400';
      case 'negative': return 'text-red-400 border-red-400';
      default: return 'text-yellow-400 border-yellow-400';
    }
  };

  return (
    <div className={cn("fixed top-4 right-4 z-40", className)}>
      <div className="bg-gray-900/90 border border-gray-700/50 rounded-lg p-3 backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-white text-sm font-medium">AI Tools</span>
        </div>

        {/* Quick AI Actions */}
        <div className="space-y-2">
          <Button
            onClick={runSentimentAnalysis}
            disabled={isAnalyzing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-sm h-8"
          >
            <Brain size={14} className="mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Check Mood'}
          </Button>

          <Button
            onClick={generateSummary}
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm h-8"
          >
            <FileText size={14} className="mr-2" />
            Get Summary
          </Button>
        </div>

        {/* Sentiment Display */}
        {sentiment && (
          <div className="border-t border-gray-700 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Meeting Mood:</span>
              <Badge 
                variant="outline" 
                className={cn("text-xs capitalize", getMoodColor(sentiment.mood))}
              >
                {sentiment.mood} ({Math.round(sentiment.confidence * 100)}%)
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-t border-gray-700 pt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">AI Features:</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Speech Recognition:</span>
            <span className="text-green-400">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}