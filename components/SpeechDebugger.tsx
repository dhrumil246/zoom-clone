'use client';

import { useState } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export default function SpeechDebugger() {
  const [logs, setLogs] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Array<{text: string, timestamp: Date, isFinal: boolean}>>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
  };

  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening
  } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      addLog(`Speech ${isFinal ? 'FINAL' : 'interim'}: "${transcript}"`);
      
      if (isFinal && transcript.trim()) {
        setCaptions(prev => [...prev.slice(-4), {
          text: transcript,
          timestamp: new Date(),
          isFinal: true
        }]);
        addLog(`✅ Caption added: "${transcript}"`);
      }
    },
    onError: (error) => {
      addLog(`❌ Error: ${error}`);
    }
  });

  const testSpeechAPI = () => {
    addLog('🔍 Testing Speech Recognition API...');
    
    // Check if speech recognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      addLog('❌ Speech Recognition API not available');
      return;
    }
    
    addLog('✅ Speech Recognition API available');
    
    // Check permissions
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        addLog('✅ Microphone permissions granted');
      })
      .catch((err) => {
        addLog(`❌ Microphone permission denied: ${err.message}`);
      });
  };

  return (
    <div className="fixed top-4 left-4 z-50 w-96">
      <Card className="bg-dark-1 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 size={20} />
            Speech Recognition Debugger
            {!isSupported && (
              <Badge variant="destructive" className="text-xs">
                Not Supported
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Supported:</span>
              <span className={isSupported ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                {isSupported ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Listening:</span>
              <span className={isListening ? "text-green-400 ml-1" : "text-gray-400 ml-1"}>
                {isListening ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={toggleListening}
              disabled={!isSupported}
              className={`flex-1 ${
                isListening 
                  ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              <span className="ml-2">
                {isListening ? "Stop" : "Start"} Listening
              </span>
            </Button>
            
            <Button
              onClick={testSpeechAPI}
              variant="outline"
              className="border-gray-600"
            >
              Test API
            </Button>
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div className="bg-dark-2 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-green-400 mb-1">Live Transcript:</h4>
              <p className="text-sm text-gray-300">"{transcript}"</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            </div>
          )}

          {/* Recent Captions */}
          {captions.length > 0 && (
            <div className="bg-dark-2 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-400 mb-2">
                Recent Captions ({captions.length}):
              </h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {captions.map((caption, index) => (
                  <div key={index} className="text-xs text-gray-300">
                    <span className="text-gray-500">
                      {caption.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="ml-2">"{caption.text}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Logs */}
          {logs.length > 0 && (
            <div className="bg-dark-2 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-purple-400 mb-2">Debug Logs:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-400 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-400 mb-1">Instructions:</h4>
            <ol className="text-xs text-gray-300 space-y-1">
              <li>1. Click "Test API" to check browser support</li>
              <li>2. Click "Start Listening" (allow mic permissions)</li>
              <li>3. Speak clearly into your microphone</li>
              <li>4. Watch for live transcript and captions</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}