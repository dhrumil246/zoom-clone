// components/AICaptionsAnnouncement.tsx
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Sparkles, X, ArrowRight, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AICaptionsAnnouncement() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  if (!isVisible) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-yellow-600/20 border-blue-500/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500"></div>
      
      <CardContent className="p-6">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">New: AI-Powered Captions</h3>
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                BETA
              </span>
            </div>
            
            <p className="text-gray-300 mb-4 leading-relaxed">
              Experience revolutionary meeting captions powered by NVIDIA AI. Get real-time 
              transcription enhancement, automatic summarization, intelligent action item 
              extraction, and advanced sentiment analysis - all during live video calls.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push('/ai-captions-demo')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 flex items-center gap-2"
              >
                <Mic size={16} />
                Try AI Captions Demo
                <ArrowRight size={16} />
              </Button>
              
              <Button
                onClick={() => router.push('/captions')}
                variant="outline"
                className="border-gray-400 text-gray-300 hover:bg-gray-700 px-6 py-2"
              >
                Learn More
              </Button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Real-time AI Enhancement</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Auto Meeting Summaries</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>20+ Languages Supported</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}