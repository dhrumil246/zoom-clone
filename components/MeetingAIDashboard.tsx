'use client';

import { useState } from 'react';
import { 
  Brain, 
  Mic, 
  MicOff, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Sparkles,
  Download,
  Share,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useOptionalSentimentContext } from '@/contexts/SentimentContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

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

interface CaptionData {
  text: string;
  timestamp: Date;
  speaker?: string;
  enhanced?: boolean;
}

export default function MeetingAIDashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'captions' | 'settings'>('overview');
  
  // AI Features State
  const [aiFeatures, setAiFeatures] = useState({
    liveCaptions: true,
    sentimentAnalysis: true,
    enhancedCaptions: true,
    realTimeInsights: true,
    speechRecognition: true,
    autoSummary: false
  });
  
  // Sentiment State
  const [currentSentiment, setCurrentSentiment] = useState<SentimentData | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Captions State
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [captionSettings, setCaptionSettings] = useState({
    fontSize: 16,
    showTimestamps: true,
    showSpeakers: true,
    autoScroll: true,
    position: 'bottom'
  });

  // Audio State
  const [audioSettings, setAudioSettings] = useState({
    micEnabled: true,
    volume: 80,
    noiseReduction: true,
    autoGain: true
  });

  const sentimentContext = useOptionalSentimentContext();

  // Auto-analysis function
  const analyzeSentiment = async (text: string, speaker?: string) => {
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
      setSentimentHistory(prev => [...prev.slice(-9), {
        timestamp: new Date(),
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        sentiment,
        speaker
      }]);

    } catch (err) {
      console.error('Sentiment analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Speech Recognition Integration
  const {
    isListening,
    isSupported: speechSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening
  } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim() && aiFeatures.sentimentAnalysis) {
        analyzeSentiment(transcript, 'Live Speaker');
      }
      
      if (isFinal) {
        // Add to captions
        const newCaption: CaptionData = {
          text: transcript,
          timestamp: new Date(),
          speaker: 'You',
          enhanced: aiFeatures.enhancedCaptions
        };
        setCaptions(prev => [...prev.slice(-19), newCaption]);
      }
    },
    onError: (error) => {
      setError(`Speech recognition: ${error}`);
    }
  });

  // Quick sentiment analysis test
  const testSentiment = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: "I'm really excited about this meeting! Everyone is contributing great ideas and we're making excellent progress.",
          speakerContext: 'Test User'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentSentiment(result.data);
        setSentimentHistory(prev => [...prev.slice(-4), {
          timestamp: new Date(),
          sentiment: result.data,
          text: "Test analysis completed"
        }]);
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate meeting summary
  const generateSummary = async () => {
    try {
      const sampleTranscript = captions.map(c => 
        `${c.speaker || 'Speaker'}: ${c.text}`
      ).join('\n') || "This is a productive meeting with positive collaboration and good engagement from all participants.";

      const response = await fetch('/api/nvidia-nim/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: sampleTranscript,
          type: 'summary'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Here you could show the summary in a modal or save it
        console.log('Summary generated:', result.result);
        alert('Meeting summary generated! Check console for details.');
      }
    } catch (error) {
      console.error('Summary generation failed:', error);
    }
  };

  // Get overall meeting mood
  const getOverallMood = () => {
    if (!currentSentiment) return { mood: 'Unknown', color: 'text-gray-400' };
    
    switch (currentSentiment.overall) {
      case 'positive':
        return { mood: 'Positive', color: 'text-green-400' };
      case 'negative':
        return { mood: 'Negative', color: 'text-red-400' };
      default:
        return { mood: 'Neutral', color: 'text-yellow-400' };
    }
  };

  const { mood, color } = getOverallMood();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating AI Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "rounded-full w-14 h-14 shadow-2xl transition-all duration-300",
          isExpanded 
            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 scale-110"
            : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        )}
        title="AI Meeting Assistant"
      >
        {isExpanded ? (
          <X size={24} className="text-white" />
        ) : (
          <div className="relative">
            <Sparkles size={24} className="text-white" />
            {isAnalyzing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        )}
      </Button>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-96 bg-dark-1 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Brain size={20} />
                AI Meeting Assistant
              </h2>
              <Badge variant="outline" className="text-white border-white/30">
                Live
              </Badge>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <div className="text-white/80 text-xs">Mood</div>
                <div className={`text-sm font-bold ${color}`}>{mood}</div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-xs">Messages</div>
                <div className="text-white text-sm font-bold">{captions.length}</div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-xs">Features</div>
                <div className="text-white text-sm font-bold">
                  {Object.values(aiFeatures).filter(Boolean).length}/6
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-dark-2 border-b border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sentiment', label: 'Mood', icon: Brain },
              { id: 'captions', label: 'Captions', icon: MessageSquare },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-3 text-xs transition-colors",
                  activeTab === tab.id
                    ? "text-purple-400 border-b-2 border-purple-400 bg-dark-1"
                    : "text-gray-400 hover:text-white hover:bg-dark-1"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={testSentiment}
                    disabled={isAnalyzing}
                    className="text-xs bg-green-600 hover:bg-green-700"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Test Sentiment'}
                  </Button>
                  <Button
                    onClick={generateSummary}
                    className="text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    Generate Summary
                  </Button>
                </div>

                {/* Live Speech Control */}
                {speechSupported && (
                  <div className="bg-dark-2 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Live Speech</span>
                      <Button
                        onClick={toggleListening}
                        className={cn(
                          "w-8 h-8 p-0 rounded-full",
                          isListening 
                            ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                            : "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </Button>
                    </div>
                    {transcript && (
                      <div className="text-xs text-gray-400 bg-dark-1 p-2 rounded">
                        "{transcript}"
                      </div>
                    )}
                  </div>
                )}

                {/* AI Features Status */}
                <div className="space-y-2">
                  <h4 className="text-white text-sm font-medium">Active Features</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(aiFeatures).map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          enabled ? "bg-green-400" : "bg-gray-600"
                        )} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Sentiment Quick View */}
                {currentSentiment && (
                  <div className="bg-dark-2 p-3 rounded-lg">
                    <h4 className="text-white text-sm font-medium mb-2">Current Mood</h4>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${color}`}>
                        {mood} ({Math.round(currentSentiment.confidence * 100)}%)
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {currentSentiment.intensity}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sentiment Tab */}
            {activeTab === 'sentiment' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-sm font-medium">Sentiment Analysis</h4>
                  <Switch
                    checked={aiFeatures.sentimentAnalysis}
                    onCheckedChange={(checked) => 
                      setAiFeatures(prev => ({ ...prev, sentimentAnalysis: checked }))
                    }
                  />
                </div>

                {currentSentiment ? (
                  <div className="space-y-3">
                    {/* Current Sentiment */}
                    <div className="bg-dark-2 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Overall Mood</span>
                        <span className={`font-bold ${color}`}>{mood}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Confidence</span>
                        <span className="text-white text-sm">
                          {Math.round(currentSentiment.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Intensity</span>
                        <Badge variant="outline" className="text-xs">
                          {currentSentiment.intensity}
                        </Badge>
                      </div>
                    </div>

                    {/* Emotion Breakdown */}
                    <div className="bg-dark-2 p-3 rounded-lg">
                      <h5 className="text-white text-sm font-medium mb-2">Emotions</h5>
                      <div className="space-y-2">
                        {Object.entries(currentSentiment.emotions)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([emotion, value]) => (
                          <div key={emotion} className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs capitalize">{emotion}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-gray-600 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-purple-400 transition-all duration-300" 
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
                    </div>

                    {/* Keywords */}
                    {currentSentiment.keywords.length > 0 && (
                      <div className="bg-dark-2 p-3 rounded-lg">
                        <h5 className="text-white text-sm font-medium mb-2">Keywords</h5>
                        <div className="flex flex-wrap gap-1">
                          {currentSentiment.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Brain size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No sentiment data yet</p>
                    <Button
                      onClick={testSentiment}
                      disabled={isAnalyzing}
                      className="mt-2 text-xs"
                    >
                      {isAnalyzing ? 'Testing...' : 'Run Test Analysis'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Captions Tab */}
            {activeTab === 'captions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-sm font-medium">Live Captions</h4>
                  <Switch
                    checked={aiFeatures.liveCaptions}
                    onCheckedChange={(checked) => 
                      setAiFeatures(prev => ({ ...prev, liveCaptions: checked }))
                    }
                  />
                </div>

                {/* Caption Settings */}
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-300 text-xs">Font Size</label>
                    <Slider
                      value={[captionSettings.fontSize]}
                      onValueChange={(value) => 
                        setCaptionSettings(prev => ({ ...prev, fontSize: value[0] }))
                      }
                      max={24}
                      min={12}
                      step={2}
                      className="mt-1"
                    />
                    <span className="text-gray-400 text-xs">{captionSettings.fontSize}px</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'showTimestamps', label: 'Show Timestamps' },
                      { key: 'showSpeakers', label: 'Show Speakers' },
                      { key: 'autoScroll', label: 'Auto Scroll' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs">{label}</span>
                        <Switch
                          checked={captionSettings[key as keyof typeof captionSettings] as boolean}
                          onCheckedChange={(checked) => 
                            setCaptionSettings(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Captions */}
                <div className="bg-dark-2 p-3 rounded-lg">
                  <h5 className="text-white text-sm font-medium mb-2">Recent Captions</h5>
                  {captions.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {captions.slice(-3).map((caption, index) => (
                        <div key={index} className="text-xs text-gray-300">
                          {captionSettings.showTimestamps && (
                            <span className="text-gray-500">
                              {caption.timestamp.toLocaleTimeString()} 
                            </span>
                          )}
                          {captionSettings.showSpeakers && caption.speaker && (
                            <span className="text-blue-400 ml-1">{caption.speaker}:</span>
                          )}
                          <span className="ml-1">{caption.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">No captions yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h4 className="text-white text-sm font-medium">AI Features</h4>
                
                <div className="space-y-3">
                  {Object.entries(aiFeatures).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          setAiFeatures(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Audio Settings */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-white text-sm font-medium mb-3">Audio Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Microphone</span>
                      <Button
                        onClick={() => setAudioSettings(prev => ({ ...prev, micEnabled: !prev.micEnabled }))}
                        className={cn(
                          "w-8 h-8 p-0",
                          audioSettings.micEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                        )}
                      >
                        {audioSettings.micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-sm">Volume</span>
                        <span className="text-gray-400 text-xs">{audioSettings.volume}%</span>
                      </div>
                      <Slider
                        value={[audioSettings.volume]}
                        onValueChange={(value) => 
                          setAudioSettings(prev => ({ ...prev, volume: value[0] }))
                        }
                        max={100}
                        min={0}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      {[
                        { key: 'noiseReduction', label: 'Noise Reduction' },
                        { key: 'autoGain', label: 'Auto Gain Control' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{label}</span>
                          <Switch
                            checked={audioSettings[key as keyof typeof audioSettings] as boolean}
                            onCheckedChange={(checked) => 
                              setAudioSettings(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-white text-sm font-medium mb-3">Export</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="text-xs" onClick={generateSummary}>
                      <Download size={12} className="mr-1" />
                      Summary
                    </Button>
                    <Button className="text-xs" variant="outline">
                      <Share size={12} className="mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}