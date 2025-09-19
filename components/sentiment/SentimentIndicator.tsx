// components/sentiment/SentimentIndicator.tsx
'use client';

import { useState } from 'react';
import { SentimentAnalysis } from '@/lib/nvidia-nim/sentiment';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Frown, 
  Meh, 
  Smile, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Minus 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SentimentIndicatorProps {
  sentiment: SentimentAnalysis;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export default function SentimentIndicator({
  sentiment,
  size = 'md',
  showDetails = false,
  className,
}: SentimentIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getSentimentIcon = () => {
    switch (sentiment.overall) {
      case 'positive':
        return <Smile className={cn(
          "text-green-400",
          size === 'sm' && "w-4 h-4",
          size === 'md' && "w-5 h-5",
          size === 'lg' && "w-6 h-6"
        )} />;
      case 'negative':
        return <Frown className={cn(
          "text-red-400",
          size === 'sm' && "w-4 h-4",
          size === 'md' && "w-5 h-5",
          size === 'lg' && "w-6 h-6"
        )} />;
      default:
        return <Meh className={cn(
          "text-gray-400",
          size === 'sm' && "w-4 h-4",
          size === 'md' && "w-5 h-5",
          size === 'lg' && "w-6 h-6"
        )} />;
    }
  };

  const getSentimentColor = () => {
    switch (sentiment.overall) {
      case 'positive':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'negative':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getConfidenceColor = () => {
    if (sentiment.confidence > 0.8) return 'bg-green-500';
    if (sentiment.confidence > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDominantEmotion = () => {
    const emotions = Object.entries(sentiment.emotions);
    emotions.sort(([,a], [,b]) => b - a);
    return emotions[0];
  };

  const formatEmotionName = (emotion: string) => {
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
  };

  const EmotionBar = ({ emotion, value, color }: { emotion: string, value: number, color: string }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-300">{formatEmotionName(emotion)}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-gray-400 w-8">{Math.round(value * 100)}%</span>
    </div>
  );

  const tooltipContent = (
    <div className="space-y-3 p-2 max-w-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">Overall: {sentiment.overall}</span>
        <span className="text-xs text-gray-400">
          {Math.round(sentiment.confidence * 100)}% confident
        </span>
      </div>
      
      <div className="space-y-1">
        <EmotionBar emotion="joy" value={sentiment.emotions.joy} color="bg-yellow-400" />
        <EmotionBar emotion="sadness" value={sentiment.emotions.sadness} color="bg-blue-400" />
        <EmotionBar emotion="anger" value={sentiment.emotions.anger} color="bg-red-400" />
        <EmotionBar emotion="fear" value={sentiment.emotions.fear} color="bg-purple-400" />
        <EmotionBar emotion="surprise" value={sentiment.emotions.surprise} color="bg-orange-400" />
        <EmotionBar emotion="disgust" value={sentiment.emotions.disgust} color="bg-green-400" />
      </div>
      
      {sentiment.keywords.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Key emotions:</p>
          <div className="flex flex-wrap gap-1">
            {sentiment.keywords.slice(0, 5).map((keyword, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {sentiment.reasoning && (
        <p className="text-xs text-gray-400 italic">
          {sentiment.reasoning}
        </p>
      )}
    </div>
  );

  if (showDetails) {
    return (
      <div className={cn("space-y-3 p-4 rounded-lg border", getSentimentColor(), className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSentimentIcon()}
            <span className="font-medium capitalize">{sentiment.overall}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {Math.round(sentiment.confidence * 100)}%
            </span>
            <div className="w-12 bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-full rounded-full ${getConfidenceColor()}`}
                style={{ width: `${sentiment.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Dominant emotion:</span>
            <span className="font-medium">
              {formatEmotionName(getDominantEmotion()[0])} ({Math.round(getDominantEmotion()[1] * 100)}%)
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Intensity:</span>
            <span className={cn(
              "font-medium capitalize",
              sentiment.intensity === 'high' && "text-red-400",
              sentiment.intensity === 'medium' && "text-yellow-400",
              sentiment.intensity === 'low' && "text-green-400"
            )}>
              {sentiment.intensity}
            </span>
          </div>
        </div>
        
        {sentiment.keywords.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Emotional keywords:</p>
            <div className="flex flex-wrap gap-1">
              {sentiment.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full border transition-all cursor-pointer",
            getSentimentColor(),
            className
          )}>
            {getSentimentIcon()}
            {size !== 'sm' && (
              <>
                <span className={cn(
                  "font-medium capitalize",
                  size === 'lg' && "text-lg"
                )}>
                  {sentiment.overall}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getConfidenceColor()
                )} />
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-dark-1 border-gray-700">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}