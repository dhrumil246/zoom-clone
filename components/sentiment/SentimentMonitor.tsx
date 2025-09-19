// components/sentiment/SentimentMonitor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { SentimentAnalysis } from '@/lib/nvidia-nim/sentiment';
import SentimentIndicator from './SentimentIndicator';
import { EmotionalAlertsContainer } from './EmotionalAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Settings2, 
  BarChart3, 
  Users, 
  TrendingUp,
  Clock,
  Eye,
  EyeOff 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useOptionalSentimentContext } from '@/contexts/SentimentContext';

interface SentimentMonitorProps {
  className?: string;
}

export default function SentimentMonitor({
  className,
}: SentimentMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const sentimentContext = useOptionalSentimentContext();
  const [settings, setSettings] = useState({
    enableRealTimeAnalysis: true,
    analysisFrequency: 3,
    emotionalShiftAlerts: true,
    confidenceThreshold: 0.6,
    analyzeOnlyFinalTranscripts: true,
    trackParticipantMoods: true,
  });

  const {
    currentSentiment,
    conversationHistory,
    meetingSummary,
    isAnalyzing,
    error,
    emotionalAlerts,
    queueAnalysis,
    generateMeetingSummary,
    getSentimentTrends,
    getParticipantMoods,
    dismissAlert,
    hasRecentActivity,
    averageMeetingSentiment,
  } = useSentimentAnalysis({
    settings,
    onSentimentChange: (sentiment) => {
      console.log('Sentiment updated:', sentiment);
    },
    onEmotionalAlert: (alert) => {
      console.log('Emotional alert:', alert);
    },
  });

  // Register with sentiment context
  useEffect(() => {
    if (sentimentContext && settings.enableRealTimeAnalysis) {
      sentimentContext.registerAnalyzer((text: string, speaker?: string) => {
        queueAnalysis(text, speaker);
      });
    }
  }, [sentimentContext, queueAnalysis, settings.enableRealTimeAnalysis]);

  const sentimentTrends = getSentimentTrends();
  const participantMoods = getParticipantMoods();

  const getOverallMoodColor = () => {
    if (averageMeetingSentiment > 0.3) return 'text-green-400';
    if (averageMeetingSentiment < -0.3) return 'text-red-400';
    return 'text-gray-400';
  };

  const getOverallMoodLabel = () => {
    if (averageMeetingSentiment > 0.3) return 'Positive';
    if (averageMeetingSentiment < -0.3) return 'Negative';
    return 'Neutral';
  };

  if (!settings.enableRealTimeAnalysis) {
    return (
      <Button
        onClick={() => setSettings(prev => ({ ...prev, enableRealTimeAnalysis: true }))}
        className="rounded-2xl bg-gray-600 px-4 py-2 hover:bg-gray-700"
        title="Enable Sentiment Analysis"
      >
        <Brain size={20} className="text-white" />
        <span className="ml-2 text-xs">Enable AI Mood</span>
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Compact Sentiment Indicator */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "rounded-2xl px-4 py-2 transition-all",
            currentSentiment 
              ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              : "bg-gray-600 hover:bg-gray-700"
          )}
          title="Sentiment Monitor"
        >
          <Brain size={20} className="text-white" />
          {isAnalyzing && (
            <div className="ml-2 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {currentSentiment && !isAnalyzing && (
            <span className={cn("ml-2 text-xs font-medium", getOverallMoodColor())}>
              {getOverallMoodLabel()}
            </span>
          )}
        </Button>

        {currentSentiment && (
          <SentimentIndicator
            sentiment={currentSentiment}
            size="sm"
            className="border-gray-600"
          />
        )}
      </div>

      {/* Settings Button */}
      <Button
        onClick={() => setShowSettings(true)}
        className="rounded-2xl bg-gray-600 px-3 py-2 hover:bg-gray-700"
        title="Sentiment Settings"
      >
        <Settings2 size={16} className="text-white" />
      </Button>

      {/* Analytics Button */}
      {hasRecentActivity && (
        <Button
          onClick={() => setShowAnalytics(true)}
          className="rounded-2xl bg-blue-600 px-3 py-2 hover:bg-blue-700"
          title="Sentiment Analytics"
        >
          <BarChart3 size={16} className="text-white" />
        </Button>
      )}

      {/* Expanded View */}
      {isExpanded && currentSentiment && (
        <Card className="fixed bottom-32 right-4 z-40 w-80 bg-dark-1 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Brain size={16} />
                Real-time Mood Analysis
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                <EyeOff size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SentimentIndicator
              sentiment={currentSentiment}
              size="md"
              showDetails={true}
            />
            
            {hasRecentActivity && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Meeting Mood:</span>
                  <span className={cn("font-medium", getOverallMoodColor())}>
                    {getOverallMoodLabel()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Messages Analyzed:</span>
                  <span className="text-white">{conversationHistory.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white">{Object.keys(participantMoods).length}</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emotional Alerts */}
      <EmotionalAlertsContainer
        alerts={emotionalAlerts}
        onDismiss={dismissAlert}
        maxAlerts={3}
      />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-dark-1 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Sentiment Analysis Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Real-time Analysis</label>
              <input
                type="checkbox"
                checked={settings.enableRealTimeAnalysis}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  enableRealTimeAnalysis: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm">Analysis Frequency (seconds)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.analysisFrequency}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  analysisFrequency: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{settings.analysisFrequency} seconds</span>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Emotional Alerts</label>
              <input
                type="checkbox"
                checked={settings.emotionalShiftAlerts}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emotionalShiftAlerts: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm">Confidence Threshold</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  confidenceThreshold: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(settings.confidenceThreshold * 100)}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Track Participant Moods</label>
              <input
                type="checkbox"
                checked={settings.trackParticipantMoods}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  trackParticipantMoods: e.target.checked
                }))}
                className="rounded"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="bg-dark-1 text-white border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Sentiment Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-dark-2 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Overall Mood</span>
                  </div>
                  <div className={cn("text-2xl font-bold", getOverallMoodColor())}>
                    {getOverallMoodLabel()}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-2 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Participants</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {Object.keys(participantMoods).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-2 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Messages</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {conversationHistory.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sentiment Trends */}
            {sentimentTrends.length > 0 && (
              <Card className="bg-dark-2 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Sentiment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sentimentTrends.slice(-10).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                        <span className="text-xs text-gray-400">
                          {trend.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "capitalize font-medium",
                            trend.sentiment === 'positive' && "text-green-400",
                            trend.sentiment === 'negative' && "text-red-400",
                            trend.sentiment === 'neutral' && "text-gray-400"
                          )}>
                            {trend.sentiment}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({Math.round(trend.confidence * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participant Moods */}
            {Object.keys(participantMoods).length > 0 && (
              <Card className="bg-dark-2 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Participant Moods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(participantMoods).map(([participantId, mood]) => (
                      <div key={participantId} className="flex items-center justify-between p-3 bg-dark-1 rounded">
                        <div>
                          <span className="font-medium text-white">{participantId}</span>
                          <div className="text-xs text-gray-400">
                            {mood.messageCount} messages
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "capitalize font-medium",
                            mood.averageSentiment === 'positive' && "text-green-400",
                            mood.averageSentiment === 'negative' && "text-red-400",
                            mood.averageSentiment === 'neutral' && "text-gray-400"
                          )}>
                            {mood.averageSentiment}
                          </div>
                          <div className="text-xs text-gray-400">
                            Trend: {mood.recentTrend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Summary Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateMeetingSummary}
                disabled={isAnalyzing || !hasRecentActivity}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isAnalyzing ? 'Generating...' : 'Generate Meeting Mood Summary'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}