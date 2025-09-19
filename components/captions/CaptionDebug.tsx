// components/captions/CaptionDebug.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

export default function CaptionDebug() {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [microphoneTest, setMicrophoneTest] = useState<string>('not-tested');
  const [isSecureContext, setIsSecureContext] = useState(false);

  useEffect(() => {
    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';
    setIsSecureContext(isSecure);

    // Check browser support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                              (window as any).SpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    // Check microphone permission
    if (navigator.permissions) {
      // Cast to any to avoid relying on PermissionName in browsers/types
      navigator.permissions.query({ name: 'microphone' as any })
        .then(permission => {
          setPermissionStatus(permission.state);
          permission.addEventListener('change', () => {
            setPermissionStatus(permission.state);
          });
        })
        .catch(() => {
          setPermissionStatus('unavailable');
        });
    }
  }, []);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneTest('success');
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      setMicrophoneTest(`error: ${error.name}`);
    }
  };

  const testSpeechRecognition = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                              (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log('Recognition started');
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0];
      console.log('Recognition result:', result.transcript);
      alert(`Recognized: "${result.transcript}"`);
    };

    recognition.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      alert(`Recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('Recognition ended');
    };

    recognition.start();
  };

  return (
    <div className="fixed top-4 right-4 bg-dark-1 text-white p-4 rounded-lg border border-gray-600 max-w-xs z-[9999]">
      <h3 className="font-bold mb-2">Caption Debug</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Secure Context:</strong> {isSecureContext ? '✅ Yes' : '❌ No (HTTPS required)'}
        </div>
        <div>
          <strong>Browser Support:</strong> {isSupported ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Microphone Permission:</strong> {permissionStatus}
        </div>
        <div>
          <strong>Microphone Test:</strong> {microphoneTest}
        </div>
        {!isSecureContext && (
          <div className="text-yellow-400 text-xs">
            ⚠️ Speech recognition requires HTTPS
          </div>
        )}
        <div className="space-y-1">
          <Button 
            onClick={testMicrophone}
            className="w-full text-xs py-1"
            size="sm"
          >
            Test Microphone
          </Button>
          <Button 
            onClick={testSpeechRecognition}
            className="w-full text-xs py-1"
            size="sm"
            disabled={!isSecureContext || !isSupported}
          >
            Test Speech Recognition
          </Button>
        </div>
      </div>
    </div>
  );
}
