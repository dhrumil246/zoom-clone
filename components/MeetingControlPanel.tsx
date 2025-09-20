'use client';

import { useState } from 'react';
import { 
  Download, 
  FileText, 
  Settings,
  Mic,
  MicOff,
  Sparkles,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface MeetingControlPanelProps {
  isListening: boolean;
  onToggleListening: () => void;
  captionsEnabled: boolean;
  onToggleCaptions: () => void;
  enhancedCaptions: boolean;
  onToggleEnhanced: () => void;
  transcript: string[];
  onShowSentiment: () => void;
}

export default function MeetingControlPanel({
  isListening,
  onToggleListening,
  captionsEnabled,
  onToggleCaptions,
  enhancedCaptions,
  onToggleEnhanced,
  transcript,
  onShowSentiment
}: MeetingControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const downloadTranscript = () => {
    if (transcript.length === 0) {
      alert('No transcript available yet. Start speaking to generate content.');
      return;
    }

    const content = transcript.map((text, index) => 
      `[${new Date().toLocaleTimeString()}] ${text}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSummary = async () => {
    if (transcript.length === 0) {
      alert('No transcript available to summarize.');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      console.log('Generating summary for transcript:', transcript.join(' '));
      
      const response = await fetch('/api/nvidia-nim/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: transcript.join(' '),
          type: 'summary'
        })
      });

      console.log('Summary API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Summary result:', result);
        
        const summaryContent = `MEETING SUMMARY\nGenerated: ${new Date().toLocaleString()}\n\n${result.result}`;
        
        const blob = new Blob([summaryContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-summary-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Summary downloaded successfully!');
      } else {
        const errorText = await response.text();
        console.error('Summary API error:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Summary generation failed:', error);
      alert(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Toggle Button */}
      <div className="flex flex-col items-end gap-2">
        {/* Expanded Panel */}
        {isExpanded && (
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl p-4 w-80 mb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                Meeting Tools
              </h3>
              <Badge variant={isListening && captionsEnabled ? "default" : "secondary"} className="text-xs">
                {isListening && captionsEnabled ? "Recording" : "Paused"}
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-white">{transcript.length}</div>
                <div className="text-xs text-gray-400">Messages</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-400">
                  {enhancedCaptions ? "AI" : "Basic"}
                </div>
                <div className="text-xs text-gray-400">Captions</div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {/* Caption Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Live Captions</span>
                  <Switch 
                    checked={captionsEnabled}
                    onCheckedChange={onToggleCaptions}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">AI Enhanced</span>
                  <Switch 
                    checked={enhancedCaptions}
                    onCheckedChange={onToggleEnhanced}
                    disabled={!captionsEnabled}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={downloadTranscript}
                  className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                  disabled={transcript.length === 0}
                >
                  <Download size={12} className="mr-1" />
                  Transcript
                </Button>
                
                <Button
                  onClick={downloadSummary}
                  className="bg-green-600 hover:bg-green-700 text-xs h-8"
                  disabled={transcript.length === 0 || isGeneratingSummary}
                >
                  <FileText size={12} className="mr-1" />
                  {isGeneratingSummary ? 'Generating...' : 'Summary'}
                </Button>
              </div>

              <Button
                onClick={onShowSentiment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-sm h-9"
              >
                <BarChart3 size={14} className="mr-2" />
                View Sentiment Report
              </Button>
            </div>
          </div>
        )}

        {/* Main Control Button */}
        <div className="flex items-center gap-2">
          {/* Recording Status */}
          <Button
            onClick={onToggleListening}
            className={cn(
              "rounded-full w-12 h-12 shadow-lg transition-all duration-300",
              (isListening && captionsEnabled)
                ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-red-600/30" 
                : "bg-green-600 hover:bg-green-700 shadow-green-600/30"
            )}
            title={(isListening && captionsEnabled) ? "Stop Recording" : "Start Recording"}
          >
            {(isListening && captionsEnabled) ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>

          {/* Expand/Collapse Button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "rounded-full w-12 h-12 shadow-lg transition-all duration-300",
              isExpanded 
                ? "bg-purple-600 hover:bg-purple-700" 
                : "bg-gray-700 hover:bg-gray-600"
            )}
            title="Meeting Tools"
          >
            {isExpanded ? <ChevronDown size={20} /> : <Settings size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}