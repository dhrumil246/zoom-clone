// components/captions/LiveCaptionsAI.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Languages, Settings2, Download, Mic, MicOff, Sparkles, FileText, CheckSquare } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '@/lib/utils';
import { useNimCaptions } from '@/hooks/useNimCaptions';
import { formatTranscript } from '@/lib/captions/formatters';
import { NimCaptionDisplay } from './NimCaptionDisplay';
import { NimCaptionSettingsPanel } from './NimCaptionSettings';
import { MeetingSummary } from './MeetingSummary';
import CaptionCollaboration from './CaptionCollaboration';
import { useOptionalSentimentContext } from '@/contexts/SentimentContext';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'pt-PT', label: 'Portuguese (Portugal)' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'nl-NL', label: 'Dutch' },
  { code: 'sv-SE', label: 'Swedish' },
  { code: 'no-NO', label: 'Norwegian' },
  { code: 'da-DK', label: 'Danish' },
  { code: 'fi-FI', label: 'Finnish' },
];

interface LiveCaptionsAIProps {
  enableAI?: boolean;
  onSentimentAnalysis?: (text: string, speaker?: string) => void;
}

export default function LiveCaptionsAI({ enableAI = true, onSentimentAnalysis }: LiveCaptionsAIProps) {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const sentimentContext = useOptionalSentimentContext();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isSupported, setIsSupported] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);

  // Check browser compatibility and secure context
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';
    setIsSecureContext(isSecure);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                              (window as any).SpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const {
    isListening,
    transcript,
    currentSession,
    error,
    startListening,
    stopListening,
    downloadTranscript,
    clearTranscript,
    nimSettings,
    updateNimSettings,
    generateSummary,
    extractActionItems,
    isProcessingNim,
  } = useNimCaptions({
    language: selectedLanguage,
    continuous: true,
    interimResults: true,
    nimSettings: enableAI ? {
      enableNvidiaEnhancement: true,
      enhanceOnlyFinalCaptions: true,
      useContextAwareness: true,
      autoGenerateSummary: false,
      extractActionItems: false,
      confidenceThreshold: 0.7,
    } : {
      enableNvidiaEnhancement: false,
      enhanceOnlyFinalCaptions: false,
      useContextAwareness: false,
      autoGenerateSummary: false,
      extractActionItems: false,
      confidenceThreshold: 0.7,
    },
  });

  const canUseCaptions = isSupported && isSecureContext;
  const hasTranscript = (transcript?.filter(t => t.isFinal).length ?? 0) > 0;

  // Handle sentiment analysis for transcript updates
  useEffect(() => {
    if (transcript && transcript.length > 0) {
      const latestEntry = transcript[transcript.length - 1];
      if (latestEntry.isFinal && latestEntry.text.trim().length > 0) {
        // Call the prop callback if provided
        onSentimentAnalysis?.(latestEntry.text, latestEntry.speaker);
        // Also use the context if available
        sentimentContext?.analyzeText(latestEntry.text, latestEntry.speaker);
      }
    }
  }, [transcript, onSentimentAnalysis, sentimentContext]);

  const handleToggleCaptions = useCallback(async () => {
    if (isEnabled) {
      stopListening();
      setIsEnabled(false);
    } else {
      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        startListening();
        setIsEnabled(true);
      } catch (err) {
        console.error('Microphone permission denied:', err);
        alert('Microphone permission is required for captions. Please allow microphone access and try again.');
      }
    }
  }, [isEnabled, startListening, stopListening]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (isListening) {
      stopListening();
      // Give some time for the recognition to fully stop before restarting
      setTimeout(() => {
        if (isEnabled) {
          startListening();
        }
      }, 500);
    }
  };

  const handleDownloadTranscript = (format: 'text' | 'srt' | 'webvtt') => {
    if (currentSession) {
      downloadTranscript(format);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      await generateSummary();
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  const handleExtractActionItems = async () => {
    try {
      await extractActionItems();
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to extract action items:', error);
    }
  };

  if (!call || !localParticipant) return null;

  return (
    <>
      {/* Caption Controls Button Group */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleToggleCaptions}
          disabled={!canUseCaptions}
          className={cn(
            "rounded-2xl px-4 py-2",
            !canUseCaptions 
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : isEnabled 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-[#19232d] hover:bg-[#4c535b]"
          )}
          title={
            !canUseCaptions 
              ? "Captions not available (requires HTTPS and supported browser)"
              : isEnabled 
              ? "Disable AI Captions" 
              : "Enable AI Captions"
          }
        >
          {isEnabled ? (
            <Mic size={20} className="text-white" />
          ) : (
            <MicOff size={20} className="text-white" />
          )}
          <span className="ml-2 text-xs">
            {enableAI ? 'AI' : 'CC'}
          </span>
          {enableAI && isEnabled && (
            <Sparkles size={12} className="ml-1 text-yellow-400" />
          )}
        </Button>

        {isEnabled && canUseCaptions && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
                  title="Select Language"
                >
                  <Languages size={20} className="text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white max-h-96 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      "cursor-pointer",
                      selectedLanguage === lang.code && "bg-[#4c535b]"
                    )}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {enableAI && (
              <Button
                onClick={() => setShowSettings(true)}
                className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
                title="AI Settings"
              >
                <Settings2 size={20} className="text-white" />
                <Sparkles size={12} className="ml-1 text-yellow-400" />
              </Button>
            )}

            <Button
              onClick={() => setShowTranscript(true)}
              className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
              title="View Transcript"
            >
              <Download size={20} className="text-white" />
            </Button>

            {enableAI && hasTranscript && (
              <>
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isProcessingNim}
                  className="rounded-2xl bg-blue-600 px-3 py-2 hover:bg-blue-700 disabled:opacity-50"
                  title="Generate AI Summary"
                >
                  {isProcessingNim ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText size={20} className="text-white" />
                  )}
                </Button>

                <Button
                  onClick={handleExtractActionItems}
                  disabled={isProcessingNim}
                  className="rounded-2xl bg-purple-600 px-3 py-2 hover:bg-purple-700 disabled:opacity-50"
                  title="Extract Action Items"
                >
                  {isProcessingNim ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckSquare size={20} className="text-white" />
                  )}
                </Button>

                <Button
                  onClick={() => setShowSummary(true)}
                  className="rounded-2xl bg-green-600 px-3 py-2 hover:bg-green-700"
                  title="View AI Summary"
                >
                  <Sparkles size={20} className="text-white" />
                </Button>
              </>
            )}

            {/* Share captions with call participants */}
            <CaptionCollaboration
              transcript={transcript.map(t => ({
                text: t.enhancedText || t.text,
                timestamp: t.timestamp,
                startTime: t.startTime,
                endTime: t.endTime,
                confidence: t.nimConfidence || t.confidence,
                isFinal: t.isFinal,
                speaker: t.speaker,
              }))}
              sessionId={currentSession?.id}
              canShare={canUseCaptions}
            />
          </>
        )}
      </div>

      {/* Live Caption Display */}
      {isEnabled && canUseCaptions && (
        <>
          {enableAI ? (
            <NimCaptionDisplay
              transcript={transcript}
              isListening={isListening}
              showConfidence={true}
              showProcessingStatus={true}
              maxDisplayEntries={10}
              className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 max-w-4xl"
            />
          ) : (
            <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 max-w-4xl bg-black bg-opacity-80 rounded-lg p-4">
              <div className="space-y-2">
                {transcript.slice(-5).map((entry, index) => (
                  <div
                    key={`${entry.timestamp.getTime()}_${index}`}
                    className={cn(
                      "p-2 rounded text-white",
                      entry.isFinal ? "bg-gray-700" : "bg-gray-600 italic"
                    )}
                  >
                    {entry.speaker && (
                      <span className="font-medium text-blue-400 mr-2">
                        {entry.speaker}:
                      </span>
                    )}
                    {entry.text}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg max-w-md text-center">
              {error}
            </div>
          )}

          {isProcessingNim && (
            <div className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>NVIDIA AI Processing...</span>
            </div>
          )}
        </>
      )}

      {/* Show error for unsupported environment */}
      {isEnabled && !canUseCaptions && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-white px-4 py-2 rounded-lg max-w-md text-center">
          {!isSecureContext ? 'Captions require HTTPS connection' : 'Browser does not support speech recognition'}
        </div>
      )}

      {/* AI Settings Dialog */}
      {enableAI && (
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-dark-1 text-white border-dark-1 max-w-2xl">
            <DialogHeader>
              <DialogTitle>NVIDIA AI Caption Settings</DialogTitle>
            </DialogHeader>
            <NimCaptionSettingsPanel
              settings={nimSettings}
              onSettingsChange={updateNimSettings}
              onGenerateSummary={handleGenerateSummary}
              onExtractActionItems={handleExtractActionItems}
              isProcessing={isProcessingNim}
              hasTranscript={hasTranscript}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="bg-dark-1 text-white border-dark-1 max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {enableAI ? 'AI-Enhanced Meeting Transcript' : 'Meeting Transcript'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleDownloadTranscript('text')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={!hasTranscript}
              >
                Download as Text
              </Button>
              <Button
                onClick={() => handleDownloadTranscript('srt')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={!hasTranscript}
              >
                Download as SRT
              </Button>
              <Button
                onClick={() => handleDownloadTranscript('webvtt')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={!hasTranscript}
              >
                Download as WebVTT
              </Button>
              <Button
                onClick={clearTranscript}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear
              </Button>
              {enableAI && hasTranscript && (
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isProcessingNim}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessingNim ? 'Generating...' : 'Generate AI Summary'}
                </Button>
              )}
            </div>
            <div className="bg-[#19232d] p-4 rounded-lg max-h-96 overflow-y-auto">
              {enableAI ? (
                <div className="space-y-2">
                  {transcript.filter(t => t.isFinal).map((entry, index) => (
                    <div key={index} className="p-3 border border-gray-600 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-400">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        {entry.processingStatus === 'enhanced' && (
                          <span className="text-xs text-green-400">✨ AI Enhanced</span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {entry.speaker && (
                          <span className="font-medium text-blue-400 mr-2">
                            {entry.speaker}:
                          </span>
                        )}
                        {entry.enhancedText || entry.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm">
                  {formatTranscript(transcript, 'text')}
                </pre>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      {enableAI && (
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="bg-dark-1 text-white border-dark-1 max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>NVIDIA AI Meeting Analysis</DialogTitle>
            </DialogHeader>
            <MeetingSummary
              session={currentSession}
              onGenerateSummary={handleGenerateSummary}
              onExtractActionItems={handleExtractActionItems}
              isProcessing={isProcessingNim}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}