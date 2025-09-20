'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, Settings2, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptionalSentimentContext } from '@/contexts/SentimentContext';

interface SentimentData {
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

interface SentimentHistory {
  timestamp: Date;
  text: string;
  sentiment: SentimentData;
  speaker?: string;
}

export default function WorkingSentimentMonitor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState<SentimentData | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentHistory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const lastAnalysisTime = useRef<number>(0);
  const sentimentContext = useOptionalSentimentContext();

  // Auto-analysis function
  const analyzeSentiment = async (text: string, speaker?: string) => {
    // Throttle analysis to every 3 seconds
    const now = Date.now();
    if (now - lastAnalysisTime.current < 3000) return;
    lastAnalysisTime.current = now;

    if (!text.trim() || text.length < 10) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speakerContext: speaker })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const sentiment = result.data;

      setCurrentSentiment(sentiment);
      
      // Add to history
      const historyEntry: SentimentHistory = {
        timestamp: new Date(),
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        sentiment,
        speaker
      };
      
      setSentimentHistory(prev => [...prev.slice(-9), historyEntry]); // Keep last 10

    } catch (err) {
      console.error('Sentiment analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Test with sample text
  const testSentiment = async () => {
    const sampleTexts = [
      "I'm really excited about this project! It's going to be amazing.",
      "I'm feeling frustrated with these constant delays and issues.",
      "Let's review the quarterly results and discuss next steps.",
      "This is absolutely fantastic work, everyone should be proud!",
      "I'm concerned about the timeline and budget constraints."
    ];
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    await analyzeSentiment(randomText, 'Test User');
  };

  // Register with sentiment context for live analysis
  useEffect(() => {
    if (sentimentContext && isEnabled) {
      sentimentContext.registerAnalyzer((text: string, speaker?: string) => {
        analyzeSentiment(text, speaker);
      });
    }
  }, [sentimentContext, isEnabled]);

  // Get sentiment color
  const getSentimentColor = (sentiment?: SentimentData | null) => {
    if (!sentiment) return 'text-gray-400';
    switch (sentiment.overall) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  // Get sentiment label
  const getSentimentLabel = (sentiment?: SentimentData | null) => {
    if (!sentiment) return 'No Data';
    return sentiment.overall.charAt(0).toUpperCase() + sentiment.overall.slice(1);
  };

  // Get dominant emotion
  const getDominantEmotion = (emotions: SentimentData['emotions']) => {
    const entries = Object.entries(emotions);
    const dominant = entries.reduce((max, [emotion, value]) => 
      value > max.value ? { emotion, value } : max, 
      { emotion: 'neutral', value: 0 }
    );
    return dominant.emotion;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Main Brain Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`rounded-2xl px-4 py-2 transition-all ${
          currentSentiment 
            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            : "bg-gray-600 hover:bg-gray-700"
        }`}
        title="Live Sentiment Analysis"
      >
        <Brain size={20} className="text-white" />
        {isAnalyzing && (
          <div className="ml-2 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {currentSentiment && !isAnalyzing && (
          <span className={`ml-2 text-xs font-medium ${getSentimentColor(currentSentiment)}`}>
            {getSentimentLabel(currentSentiment)}
          </span>
        )}
      </Button>

      {/* Settings Toggle */}
      <Button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`rounded-2xl px-3 py-2 ${
          isEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
        }`}
        title={isEnabled ? 'Disable Auto-Analysis' : 'Enable Auto-Analysis'}
      >
        <Settings2 size={16} className="text-white" />
      </Button>

      {/* Test Button */}
      <Button
        onClick={testSentiment}
        disabled={isAnalyzing}
        className="rounded-2xl bg-orange-600 px-3 py-2 hover:bg-orange-700"
        title="Test Sentiment Analysis"
      >
        <TrendingUp size={16} className="text-white" />
      </Button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed bottom-32 right-4 z-50 w-96 bg-dark-1 border border-gray-700 rounded-lg shadow-xl">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold flex items-center gap-2">
                <Brain size={18} />
                Live Sentiment Analysis
              </h3>
              <Button
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0 bg-transparent hover:bg-gray-700 text-gray-400"
              >
                ✕
              </Button>
            </div>

            {/* Current Sentiment */}
            {currentSentiment && (
              <div className="mb-4 p-3 bg-dark-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Current Mood:</span>
                  <span className={`font-bold ${getSentimentColor(currentSentiment)}`}>
                    {getSentimentLabel(currentSentiment)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Confidence:</span>
                  <span className="text-white text-sm">
                    {Math.round(currentSentiment.confidence * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Intensity:</span>
                  <span className="text-white text-sm capitalize">
                    {currentSentiment.intensity}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 text-sm">Dominant Emotion:</span>
                  <span className="text-white text-sm capitalize">
                    {getDominantEmotion(currentSentiment.emotions)}
                  </span>
                </div>

                {/* Emotion Breakdown */}
                <div className="space-y-1">
                  <span className="text-gray-300 text-xs">Emotions:</span>
                  {Object.entries(currentSentiment.emotions).map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs capitalize">{emotion}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-gray-600 rounded">
                          <div 
                            className="h-1 bg-blue-400 rounded" 
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-300 text-xs w-8">
                          {Math.round(value * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Keywords */}
                {currentSentiment.keywords.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-300 text-xs">Keywords: </span>
                    <span className="text-blue-300 text-xs">
                      {currentSentiment.keywords.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={testSentiment}
                disabled={isAnalyzing}
                className="flex-1 text-xs bg-green-600 hover:bg-green-700"
              >
                {isAnalyzing ? 'Analyzing...' : 'Test Analysis'}
              </Button>
              <Button
                onClick={() => setIsEnabled(!isEnabled)}
                className={`flex-1 text-xs ${
                  isEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isEnabled ? 'Disable Auto' : 'Enable Auto'}
              </Button>
            </div>

            {/* Status */}
            <div className="mb-4 p-2 bg-dark-2 rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400">Auto-Analysis:</span>
                <span className={isEnabled ? 'text-green-400' : 'text-red-400'}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400">Total Analyzed:</span>
                <span className="text-white">{sentimentHistory.length}</span>
              </div>
              {error && (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertTriangle size={12} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Recent History */}
            {sentimentHistory.length > 0 && (
              <div>
                <h4 className="text-gray-300 text-sm font-medium mb-2">Recent Analysis:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sentimentHistory.slice(-5).reverse().map((entry, index) => (
                    <div key={index} className="p-2 bg-dark-2 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={`font-medium ${getSentimentColor(entry.sentiment)}`}>
                          {getSentimentLabel(entry.sentiment)}
                        </span>
                      </div>
                      <div className="text-gray-300 truncate">
                        {entry.speaker && `${entry.speaker}: `}{entry.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {sentimentHistory.length === 0 && !isAnalyzing && (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-2">
                  🎤 Start speaking or click &quot;Test Analysis&quot;
                </p>
                <p className="text-gray-500 text-xs">
                  AI will analyze emotions in real-time during meetings
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}