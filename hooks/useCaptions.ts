// hooks/useCaptions.ts
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CaptionSession, TranscriptEntry, CaptionSettings } from '@/lib/captions/types';
import { CaptionStorage } from '@/lib/captions/storage';
import { formatTranscript } from '@/lib/captions/formatters';

interface UseCaptionsOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface UseCaptionsReturn {
  isListening: boolean;
  transcript: TranscriptEntry[];
  currentSession: CaptionSession | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  clearTranscript: () => void;
  downloadTranscript: (format: 'text' | 'srt' | 'webvtt') => void;
  sessions: CaptionSession[];
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

export function useCaptions(options: UseCaptionsOptions = {}): UseCaptionsReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSession, setCurrentSession] = useState<CaptionSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CaptionSession[]>([]);

  const recognitionRef = useRef<any>(null);
  const storage = useRef(new CaptionStorage());
  const beginTimeRef = useRef<Date | null>(null);

  // Smoothing helpers
  const interimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInterimRef = useRef<TranscriptEntry | null>(null);
  const lastFinalRef = useRef<TranscriptEntry | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we're running on HTTPS or localhost
      const isSecureContext = window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        setError('Speech recognition requires HTTPS. Please use a secure connection.');
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition;
      
      if (SpeechRecognition) {
        // Clean up previous recognition if it exists
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore errors when stopping
          }
          recognitionRef.current = null;
        }

        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = continuous;
          recognition.interimResults = interimResults;
          recognition.maxAlternatives = maxAlternatives;
          recognition.lang = language;

          recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
            setError(null);
            beginTimeRef.current = new Date();
          };

          recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
            if (currentSession) {
              storage.current.saveSession(currentSession);
            }
          };

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            
            // Handle specific errors appropriately
            switch (event.error) {
              case 'not-allowed':
                setError('Microphone access denied. Please allow microphone permissions and ensure you are using HTTPS.');
                break;
              case 'service-not-allowed':
                setError('Speech recognition service not allowed. Please ensure you are using HTTPS and have proper permissions.');
                break;
              case 'no-speech':
                setError('No speech detected. Please try again.');
                break;
              case 'audio-capture':
                setError('No microphone found. Please check your audio device.');
                break;
              case 'network':
                setError('Network error. Please check your internet connection.');
                break;
              case 'aborted':
                // Don't show error for user-initiated stop
                setError(null);
                break;
              default:
                setError(`Speech recognition error: ${event.error}`);
            }
          };

          recognition.onresult = (event: any) => {
            const results = event.results;
            const currentIndex = event.resultIndex;

            for (let i = currentIndex; i < results.length; i++) {
              const result = results[i];
              const transcriptText = String(result[0].transcript || '').trim();
              const isFinal = result.isFinal;

              const baseEntry: TranscriptEntry = {
                text: transcriptText,
                timestamp: new Date(),
                startTime: beginTimeRef.current || new Date(),
                endTime: new Date(),
                confidence: result[0].confidence,
                isFinal,
                speaker: 'User',
              };

              if (!isFinal) {
                // Throttle interim updates to reduce flicker
                pendingInterimRef.current = baseEntry;
                if (!interimTimerRef.current) {
                  interimTimerRef.current = setTimeout(() => {
                    const interim = pendingInterimRef.current;
                    interimTimerRef.current = null;
                    if (!interim) return;
                    setTranscript(prev => {
                      const finals = prev.filter(e => e.isFinal);
                      return [...finals, interim];
                    });
                  }, 120);
                }
              } else {
                // Clear any pending interim
                pendingInterimRef.current = null;
                if (interimTimerRef.current) {
                  clearTimeout(interimTimerRef.current);
                  interimTimerRef.current = null;
                }

                const finalEntry = baseEntry;

                // Merge very short final fragments into the previous final to avoid choppiness
                const shouldMerge = (() => {
                  const last = lastFinalRef.current;
                  if (!last) return false;
                  const shortByChars = finalEntry.text.length <= 8;
                  const shortByWords = finalEntry.text.split(/\s+/).length <= 2;
                  const closeInTime = finalEntry.startTime.getTime() - last.endTime.getTime() <= 1500;
                  return (shortByChars || shortByWords) && closeInTime;
                })();

                if (shouldMerge) {
                  setTranscript(prev => {
                    const idx = [...prev].reverse().findIndex(e => e.isFinal);
                    if (idx === -1) {
                      // No previous final found, just append
                      beginTimeRef.current = new Date();
                      lastFinalRef.current = finalEntry;
                      return [...prev.filter(e => e.isFinal), finalEntry];
                    }
                    const lastFinalIndex = prev.length - 1 - idx;
                    const updated = [...prev.filter(e => e.isFinal)];
                    const last = updated[updated.length - 1];
                    const merged: TranscriptEntry = {
                      ...last,
                      text: `${last.text} ${finalEntry.text}`.replace(/\s+/g, ' ').trim(),
                      endTime: finalEntry.endTime,
                      timestamp: new Date(),
                      isFinal: true,
                    };
                    updated[updated.length - 1] = merged;
                    beginTimeRef.current = new Date();
                    lastFinalRef.current = merged;
                    return updated;
                  });

                  if (currentSession) {
                    setCurrentSession(prevSession => {
                      if (!prevSession) return prevSession;
                      const t = [...prevSession.transcript];
                      if (t.length > 0) {
                        const last = t[t.length - 1];
                        t[t.length - 1] = {
                          ...last,
                          text: `${last.text} ${finalEntry.text}`.replace(/\s+/g, ' ').trim(),
                          endTime: finalEntry.endTime,
                        } as TranscriptEntry;
                      } else {
                        t.push(finalEntry);
                      }
                      const updatedSession = { ...prevSession, transcript: t, endTime: new Date() };
                      storage.current.saveSession(updatedSession);
                      return updatedSession;
                    });
                  }
                } else {
                  // Append as a new final
                  setTranscript(prev => {
                    const finals = prev.filter(e => e.isFinal);
                    const next = [...finals, finalEntry];
                    beginTimeRef.current = new Date();
                    lastFinalRef.current = finalEntry;
                    return next;
                  });
                  if (currentSession) {
                    const updatedSession = {
                      ...currentSession,
                      transcript: [...currentSession.transcript, finalEntry],
                      endTime: new Date(),
                    };
                    setCurrentSession(updatedSession);
                    storage.current.saveSession(updatedSession);
                  }
                }
              }
            }
          };

          recognitionRef.current = recognition;
        } catch (error) {
          console.error('Error initializing speech recognition:', error);
          setError('Failed to initialize speech recognition service.');
        }
      } else {
        setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    }

    // Load existing sessions only once
    if (sessions.length === 0) {
      setSessions(storage.current.getAllSessions());
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language, continuous, interimResults, maxAlternatives]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    if (isListening) {
      console.log('Speech recognition already running');
      return;
    }

    // Check if we're in a secure context
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      setError('Speech recognition requires HTTPS. Please use a secure connection.');
      return;
    }

    // Check for microphone permission first
    try {
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as any });
        if (permissionStatus.state === 'denied') {
          setError('Microphone permission denied. Please allow microphone access.');
          return;
        }
      }
    } catch (error) {
      console.warn('Permission check failed:', error);
    }

    // Create new session
    const newSession: CaptionSession = {
      id: `session_${Date.now()}`,
      name: `Meeting ${new Date().toLocaleString()}`,
      startTime: new Date(),
      endTime: new Date(),
      transcript: [],
      language,
    };

    setCurrentSession(newSession);
    setTranscript([]);
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      if (err.name === 'InvalidStateError') {
        // Recognition is already started, just update state
        setIsListening(true);
      } else {
        setError('Failed to start speech recognition. Please check your browser settings and permissions.');
      }
    }
  }, [language, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
        setIsListening(false);
      }
    }
    if (currentSession) {
      storage.current.saveSession(currentSession);
      setSessions(storage.current.getAllSessions());
    }
  }, [currentSession, isListening]);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resumeListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error resuming recognition:', err);
      }
    }
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        transcript: [],
      };
      setCurrentSession(updatedSession);
      storage.current.saveSession(updatedSession);
    }
  }, [currentSession]);

  const downloadTranscript = useCallback((format: 'text' | 'srt' | 'webvtt') => {
    const effectiveTranscript = (currentSession?.transcript?.length ? currentSession.transcript : transcript).filter(Boolean);
    if (!effectiveTranscript.length) {
      setError('Nothing to download yet. Say something or wait for a final caption.');
      return;
    }

    const sessionStart = currentSession?.startTime || effectiveTranscript[0]?.startTime || new Date();
    const content = formatTranscript(effectiveTranscript, format, sessionStart);

    const mime = (() => {
      switch (format) {
        case 'srt':
          return 'application/x-subrip;charset=utf-8';
        case 'webvtt':
          return 'text/vtt;charset=utf-8';
        case 'text':
        default:
          return 'text/plain;charset=utf-8';
      }
    })();

    const extension = format === 'webvtt' ? 'vtt' : format;
    const filename = (currentSession?.name?.replace(/\s+/g, '_') || 'transcript') + `_${new Date().toISOString()}.${extension}`;

    // Add BOM for better cross-platform text encoding handling
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // Fallback for browsers that don't support download attribute well (Safari/iOS)
    const supportsDownload = 'download' in HTMLAnchorElement.prototype;
    if (!supportsDownload) {
      window.open(url, '_blank');
      // revoke later
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentSession, transcript]);

  const loadSession = useCallback((sessionId: string) => {
    const session = storage.current.getSession(sessionId);
    if (session) {
      setCurrentSession(session);
      setTranscript(session.transcript);
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    storage.current.deleteSession(sessionId);
    setSessions(storage.current.getAllSessions());
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setTranscript([]);
    }
  }, [currentSession]);

  return {
    isListening,
    transcript,
    currentSession,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    clearTranscript,
    downloadTranscript,
    sessions,
    loadSession,
    deleteSession,
  };
}