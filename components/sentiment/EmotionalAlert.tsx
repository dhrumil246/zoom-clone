// components/sentiment/EmotionalAlert.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmotionalAlertData {
  id: string;
  type: 'positive_shift' | 'negative_shift' | 'high_tension' | 'mood_drop';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

interface EmotionalAlertProps {
  alert: EmotionalAlertData;
  onDismiss: (id: string) => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function EmotionalAlert({
  alert,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}: EmotionalAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(alert.id), 300); // Wait for animation
  };

  const getAlertConfig = () => {
    switch (alert.type) {
      case 'positive_shift':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          bgColor: 'bg-green-600/20 border-green-500/30',
          iconColor: 'text-green-400',
          title: 'Positive Mood Shift',
        };
      case 'negative_shift':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          bgColor: 'bg-red-600/20 border-red-500/30',
          iconColor: 'text-red-400',
          title: 'Negative Mood Shift',
        };
      case 'high_tension':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-orange-600/20 border-orange-500/30',
          iconColor: 'text-orange-400',
          title: 'High Tension Detected',
        };
      case 'mood_drop':
        return {
          icon: <Heart className="w-5 h-5" />,
          bgColor: 'bg-blue-600/20 border-blue-500/30',
          iconColor: 'text-blue-400',
          title: 'Mood Drop Detected',
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-gray-600/20 border-gray-500/30',
          iconColor: 'text-gray-400',
          title: 'Emotional Alert',
        };
    }
  };

  const getSeverityIndicator = () => {
    switch (alert.severity) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-blue-500';
      default:
        return '';
    }
  };

  const config = getAlertConfig();

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "fixed top-20 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg",
      "transform transition-all duration-300 ease-in-out",
      "animate-in slide-in-from-right-full",
      config.bgColor,
      getSeverityIndicator(),
      !isVisible && "animate-out slide-out-to-right-full"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-white">
              {config.title}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-300 mb-2">
            {alert.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className={cn(
              "capitalize px-2 py-1 rounded-full",
              alert.severity === 'high' && "bg-red-500/20 text-red-300",
              alert.severity === 'medium' && "bg-yellow-500/20 text-yellow-300",
              alert.severity === 'low' && "bg-blue-500/20 text-blue-300"
            )}>
              {alert.severity} priority
            </span>
            <span>
              {alert.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Progress bar for auto-hide */}
      {autoHide && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className={cn(
              "h-full bg-current opacity-30 transition-all ease-linear",
              config.iconColor
            )}
            style={{
              animation: `progress ${autoHideDelay}ms linear`,
              transformOrigin: 'left'
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}

// Container component for multiple alerts
interface EmotionalAlertsContainerProps {
  alerts: EmotionalAlertData[];
  onDismiss: (id: string) => void;
  maxAlerts?: number;
}

export function EmotionalAlertsContainer({
  alerts,
  onDismiss,
  maxAlerts = 3,
}: EmotionalAlertsContainerProps) {
  // Show only the most recent alerts
  const visibleAlerts = alerts.slice(-maxAlerts);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {visibleAlerts.map((alert, index) => (
        <div
          key={alert.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index,
          }}
        >
          <EmotionalAlert
            alert={alert}
            onDismiss={onDismiss}
            autoHide={true}
            autoHideDelay={5000 + (index * 1000)} // Stagger auto-hide
          />
        </div>
      ))}
    </div>
  );
}