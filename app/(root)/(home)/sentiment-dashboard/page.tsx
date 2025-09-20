// app/(root)/(home)/sentiment-dashboard/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SentimentIndicator from '@/components/sentiment/SentimentIndicator';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Clock,
  Heart,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  PieChart,
  Activity,
  Eye,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockSentimentData = {
  currentSentiment: {
    overall: 'positive' as const,
    confidence: 0.85,
    emotions: {
      joy: 0.7,
      sadness: 0.1,
      anger: 0.05,
      fear: 0.05,
      surprise: 0.15,
      disgust: 0.02,
    },
    intensity: 'medium' as const,
    keywords: ['great', 'excited', 'looking forward', 'excellent'],
    reasoning: 'Positive sentiment detected with high confidence'
  },
  conversationHistory: [
    {
      participantId: 'user1',
      participantName: 'John Doe',
      timestamp: new Date(Date.now() - 300000),
      text: "I'm really excited about this new project direction!",
      sentiment: {
        overall: 'positive' as const,
        confidence: 0.9,
        emotions: { joy: 0.8, sadness: 0.1, anger: 0, fear: 0, surprise: 0.1, disgust: 0 },
        intensity: 'high' as const,
        keywords: ['excited', 'new'],
        reasoning: 'High positive sentiment'
      },
      contextualMood: 'excited' as const
    },
    {
      participantId: 'user2',
      participantName: 'Jane Smith',
      timestamp: new Date(Date.now() - 240000),
      text: "I have some concerns about the timeline though.",
      sentiment: {
        overall: 'negative' as const,
        confidence: 0.7,
        emotions: { joy: 0.1, sadness: 0.3, anger: 0.1, fear: 0.4, surprise: 0.1, disgust: 0 },
        intensity: 'medium' as const,
        keywords: ['concerns', 'timeline'],
        reasoning: 'Moderate negative sentiment due to concerns'
      },
      contextualMood: 'tense' as const
    },
    {
      participantId: 'user3',
      participantName: 'Mike Johnson',
      timestamp: new Date(Date.now() - 180000),
      text: "Let's work together to address those concerns.",
      sentiment: {
        overall: 'positive' as const,
        confidence: 0.8,
        emotions: { joy: 0.6, sadness: 0.1, anger: 0, fear: 0.1, surprise: 0.1, disgust: 0.1 },
        intensity: 'medium' as const,
        keywords: ['together', 'address'],
        reasoning: 'Collaborative positive sentiment'
      },
      contextualMood: 'collaborative' as const
    }
  ]
};

export default function SentimentDashboardPage() {
  const [isLive, setIsLive] = useState(false);

  const {
    currentSentiment,
    conversationHistory,
    emotionalAlerts,
    getSentimentTrends,
    getParticipantMoods,
  } = useSentimentAnalysis({
    settings: {
      enableRealTimeAnalysis: isLive,
      analysisFrequency: 5,
      emotionalShiftAlerts: true,
      confidenceThreshold: 0.6,
      analyzeOnlyFinalTranscripts: true,
      trackParticipantMoods: true,
    },
  });

  // Use mock data if no real data is available
  const displaySentiment = currentSentiment || mockSentimentData.currentSentiment;
  const displayHistory = conversationHistory.length > 0 ? conversationHistory : mockSentimentData.conversationHistory;
  const participantMoods = getParticipantMoods();

  const getOverallMoodStats = () => {
    const totalMessages = displayHistory.length;
    const positiveCount = displayHistory.filter(h => h.sentiment.overall === 'positive').length;
    const negativeCount = displayHistory.filter(h => h.sentiment.overall === 'negative').length;
    const neutralCount = totalMessages - positiveCount - negativeCount;

    return {
      positive: (positiveCount / totalMessages) * 100,
      negative: (negativeCount / totalMessages) * 100,
      neutral: (neutralCount / totalMessages) * 100,
    };
  };

  const getDominantEmotion = () => {
    const emotions = Object.entries(displaySentiment.emotions);
    emotions.sort(([,a], [,b]) => b - a);
    return emotions[0];
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'joy': return <Smile className="w-5 h-5 text-yellow-400" />;
      case 'sadness': return <Frown className="w-5 h-5 text-blue-400" />;
      case 'anger': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'fear': return <AlertTriangle className="w-5 h-5 text-purple-400" />;
      case 'surprise': return <Eye className="w-5 h-5 text-orange-400" />;
      case 'disgust': return <Frown className="w-5 h-5 text-green-400" />;
      default: return <Meh className="w-5 h-5 text-gray-400" />;
    }
  };

  const moodStats = getOverallMoodStats();
  const [dominantEmotionKey, dominantEmotionValue] = getDominantEmotion();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-dark-1 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Sentiment Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time emotional intelligence powered by NVIDIA AI
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "px-4 py-2",
              isLive ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
            )}
          >
            <Activity size={16} className="mr-2" />
            {isLive ? 'Live Mode' : 'Demo Mode'}
          </Button>
          
          <Button variant="outline" className="border-gray-600 text-gray-300">
            <Settings size={16} className="mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-dark-2 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Mood</p>
                <p className={cn(
                  "text-2xl font-bold capitalize",
                  displaySentiment.overall === 'positive' && "text-green-400",
                  displaySentiment.overall === 'negative' && "text-red-400",
                  displaySentiment.overall === 'neutral' && "text-gray-400"
                )}>
                  {displaySentiment.overall}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round(displaySentiment.confidence * 100)}% confidence
                </p>
              </div>
              {displaySentiment.overall === 'positive' ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : displaySentiment.overall === 'negative' ? (
                <TrendingDown className="w-8 h-8 text-red-400" />
              ) : (
                <Activity className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-2 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Dominant Emotion</p>
                <p className="text-2xl font-bold capitalize text-white">
                  {dominantEmotionKey}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round(dominantEmotionValue * 100)}% intensity
                </p>
              </div>
              {getEmotionIcon(dominantEmotionKey)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-2 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Messages Analyzed</p>
                <p className="text-2xl font-bold text-white">{displayHistory.length}</p>
                <p className="text-xs text-gray-500">
                  {Object.keys(participantMoods).length || 3} participants
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-2 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Emotional Alerts</p>
                <p className="text-2xl font-bold text-white">{emotionalAlerts.length}</p>
                <p className="text-xs text-gray-500">
                  Active notifications
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-dark-2 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Current Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Real-time emotional state powered by NVIDIA AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SentimentIndicator
              sentiment={displaySentiment}
              size="lg"
              showDetails={true}
            />
          </CardContent>
        </Card>

        <Card className="bg-dark-2 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Mood Distribution
            </CardTitle>
            <CardDescription>
              Overall conversation sentiment breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Positive</span>
                </div>
                <span className="text-sm font-medium">{Math.round(moodStats.positive)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${moodStats.positive}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Neutral</span>
                </div>
                <span className="text-sm font-medium">{Math.round(moodStats.neutral)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${moodStats.neutral}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm">Negative</span>
                </div>
                <span className="text-sm font-medium">{Math.round(moodStats.negative)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${moodStats.negative}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation History */}
      <Card className="bg-dark-2 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Conversation Timeline
          </CardTitle>
          <CardDescription>
            Real-time sentiment analysis of meeting conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {displayHistory.map((conv, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-dark-1 rounded-lg">
                <div className="flex-shrink-0">
                  <SentimentIndicator
                    sentiment={conv.sentiment}
                    size="sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{conv.participantName}</span>
                    <span className="text-xs text-gray-400">
                      {conv.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      conv.contextualMood === 'excited' && "bg-yellow-500/20 text-yellow-300",
                      conv.contextualMood === 'collaborative' && "bg-green-500/20 text-green-300",
                      conv.contextualMood === 'tense' && "bg-red-500/20 text-red-300",
                      conv.contextualMood === 'calm' && "bg-blue-500/20 text-blue-300",
                      conv.contextualMood === 'confused' && "bg-purple-500/20 text-purple-300",
                      conv.contextualMood === 'focused' && "bg-gray-500/20 text-gray-300"
                    )}>
                      {conv.contextualMood}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{conv.text}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Confidence: {Math.round(conv.sentiment.confidence * 100)}%</span>
                    <span>Intensity: {conv.sentiment.intensity}</span>
                    {conv.sentiment.keywords.length > 0 && (
                      <span>Keywords: {conv.sentiment.keywords.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participant Analysis */}
      <Card className="bg-dark-2 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Participant Mood Analysis
          </CardTitle>
          <CardDescription>
            Individual emotional states and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayHistory.reduce((acc, conv) => {
              if (!acc.find(p => p.id === conv.participantId)) {
                acc.push({
                  id: conv.participantId,
                  name: conv.participantName || conv.participantId,
                  messages: displayHistory.filter(h => h.participantId === conv.participantId),
                });
              }
              return acc;
            }, [] as Array<{ id: string; name: string; messages: typeof displayHistory }>).map((participant) => {
              const avgSentiment = participant.messages.reduce((sum, msg) => 
                sum + (msg.sentiment.overall === 'positive' ? 1 : msg.sentiment.overall === 'negative' ? -1 : 0), 0
              ) / participant.messages.length;
              
              const avgConfidence = participant.messages.reduce((sum, msg) => 
                sum + msg.sentiment.confidence, 0
              ) / participant.messages.length;

              return (
                <div key={participant.id} className="p-4 bg-dark-1 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{participant.name}</h3>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      avgSentiment > 0.2 ? "bg-green-500/20 text-green-300" :
                      avgSentiment < -0.2 ? "bg-red-500/20 text-red-300" :
                      "bg-gray-500/20 text-gray-300"
                    )}>
                      {avgSentiment > 0.2 ? 'Positive' : avgSentiment < -0.2 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Messages:</span>
                      <span className="text-white">{participant.messages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Confidence:</span>
                      <span className="text-white">{Math.round(avgConfidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latest Mood:</span>
                      <span className="text-white capitalize">
                        {participant.messages[participant.messages.length - 1]?.contextualMood}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}