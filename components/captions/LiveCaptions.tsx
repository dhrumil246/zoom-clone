// components/captions/LiveCaptions.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Languages, Settings2, Download, Mic, MicOff } from 'lucide-react';
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
import { useCaptions } from '@/hooks/useCaptions';
import { formatTranscript } from '@/lib/captions/formatters';
import CaptionDebug from './CaptionDebug';
import CaptionHistory from './CaptionHistory';
import CaptionSettings from './CaptionSettings';
import CaptionDisplay from './CaptionDisplay';
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

export default function LiveCaptions({ onSentimentAnalysis }: { onSentimentAnalysis?: (text: string, speaker?: string) => void }) {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const sentimentContext = useOptionalSentimentContext();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isSupported, setIsSupported] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [captionSettings, setCaptionSettings] = useState({
    fontSize: 'medium',
    position: 'bottom',
    background: 'semi-transparent',
    textColor: 'white',
  });

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
  } = useCaptions({
    language: selectedLanguage,
    continuous: true,
    interimResults: true,
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
              ? "Disable Captions" 
              : "Enable Captions"
          }
        >
          {isEnabled ? (
            <Mic size={20} className="text-white" />
          ) : (
            <MicOff size={20} className="text-white" />
          )}
          <span className="ml-2 text-xs">CC</span>
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

            <Button
              onClick={() => setShowSettings(true)}
              className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
              title="Caption Settings"
            >
              <Settings2 size={20} className="text-white" />
            </Button>

            <Button
              onClick={() => setShowTranscript(true)}
              className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
              title="View Transcript"
            >
              <Download size={20} className="text-white" />
            </Button>

            {/* Share captions with call participants */}
            <CaptionCollaboration
              transcript={transcript}
              sessionId={currentSession?.id}
              canShare={canUseCaptions}
            />
          </>
        )}
      </div>

      {/* Live Caption Display */}
      {isEnabled && canUseCaptions && (
        <>
          <CaptionDisplay
            transcript={transcript}
            settings={captionSettings}
            isListening={isListening}
          />
          {/* Remote captions are rendered inside CaptionCollaboration */}
          {error && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg max-w-md text-center">
              {error}
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

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-dark-1 text-white border-dark-1">
          <DialogHeader>
            <DialogTitle>Caption Settings</DialogTitle>
          </DialogHeader>
          <CaptionSettings
            settings={captionSettings}
            onSettingsChange={setCaptionSettings}
            onClose={() => setShowSettings(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="bg-dark-1 text-white border-dark-1 max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Meeting Transcript</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                onClick={() => handleDownloadTranscript('text')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasTranscript}
              >
                Download as Text
              </Button>
              <Button
                onClick={() => handleDownloadTranscript('srt')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasTranscript}
              >
                Download as SRT
              </Button>
              <Button
                onClick={() => handleDownloadTranscript('webvtt')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
            <div className="bg-[#19232d] p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">
                {formatTranscript(transcript, 'text')}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}