// app/(root)/(home)/captions/page.tsx
'use client';

import React, { useState } from 'react';
import { useNimCaptions } from '@/hooks/useNimCaptions';
import { NimCaptionDisplay } from '@/components/captions/NimCaptionDisplay';
import { NimCaptionSettingsPanel } from '@/components/captions/NimCaptionSettings';
import { MeetingSummary } from '@/components/captions/MeetingSummary';
import CaptionHistory from '@/components/captions/CaptionHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CaptionsPage = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'summary' | 'history'>('live');
  
  const {
    isListening,
    transcript,
    currentSession,
    error,
    startListening,
    stopListening,
    clearTranscript,
    nimSettings,
    updateNimSettings,
    generateSummary,
    extractActionItems,
    isProcessingNim,
  } = useNimCaptions({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    nimSettings: {
      enableNvidiaEnhancement: true,
      enhanceOnlyFinalCaptions: true,
      useContextAwareness: true,
      autoGenerateSummary: false,
      extractActionItems: false,
      confidenceThreshold: 0.7,
    },
  });

  const handleGenerateSummary = async () => {
    try {
      await generateSummary();
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // You could add a toast notification here
    }
  };

  const handleExtractActionItems = async () => {
    try {
      await extractActionItems();
    } catch (error) {
      console.error('Failed to extract action items:', error);
      // You could add a toast notification here
    }
  };

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          NVIDIA AI-Enhanced Captions
        </h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'live' ? 'default' : 'outline'}
            onClick={() => setActiveTab('live')}
            size="sm"
          >
            Live Captions
          </Button>
          <Button
            variant={activeTab === 'summary' ? 'default' : 'outline'}
            onClick={() => setActiveTab('summary')}
            size="sm"
          >
            AI Summary
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            size="sm"
          >
            History
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Live Captions Tab */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Caption Display */}
          <div className="lg:col-span-2 space-y-4">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Caption Controls</span>
                  <div className="flex items-center gap-2">
                    {isListening ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-red-500">Recording</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Stopped</span>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    variant={isListening ? "destructive" : "default"}
                    disabled={isProcessingNim}
                  >
                    {isListening ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                  <Button
                    onClick={clearTranscript}
                    variant="outline"
                    disabled={transcript.length === 0}
                  >
                    Clear Captions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Caption Display */}
            <NimCaptionDisplay
              transcript={transcript}
              isListening={isListening}
              showConfidence={true}
              showProcessingStatus={true}
              maxDisplayEntries={15}
            />
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            <NimCaptionSettingsPanel
              settings={nimSettings}
              onSettingsChange={updateNimSettings}
              onGenerateSummary={handleGenerateSummary}
              onExtractActionItems={handleExtractActionItems}
              isProcessing={isProcessingNim}
              hasTranscript={transcript.filter(t => t.isFinal).length > 0}
            />

            {/* Session Info */}
            {currentSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {currentSession.name}</p>
                  <p className="text-sm"><strong>Started:</strong> {currentSession.startTime.toLocaleTimeString()}</p>
                  <p className="text-sm"><strong>Captions:</strong> {transcript.filter(t => t.isFinal).length}</p>
                  <p className="text-sm"><strong>AI Enhanced:</strong> {transcript.filter(t => t.processingStatus === 'enhanced').length}</p>
                  {isProcessingNim && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      <span>Processing with NVIDIA AI...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* AI Summary Tab */}
      {activeTab === 'summary' && (
        <MeetingSummary
          session={currentSession}
          onGenerateSummary={handleGenerateSummary}
          onExtractActionItems={handleExtractActionItems}
          isProcessing={isProcessingNim}
        />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <CaptionHistory />
      )}
    </section>
  );
};

export default CaptionsPage;