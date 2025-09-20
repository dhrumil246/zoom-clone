// app/(root)/(home)/ai-captions-demo/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LiveCaptionsAI from '@/components/captions/LiveCaptionsAI';
import { Sparkles, Mic, FileText, CheckSquare, Globe, Zap, Shield, Users } from 'lucide-react';

export default function AICaptionsDemoPage() {
  const [isDemo, setIsDemo] = useState(false);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      title: "NVIDIA AI Enhancement",
      description: "Powered by NVIDIA NIM for intelligent speech processing and enhancement"
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      title: "Real-time Summarization",
      description: "Generate meeting summaries and key points instantly during live calls"
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-green-400" />,
      title: "Action Item Extraction",
      description: "Automatically identify and extract actionable items from conversations"
    },
    {
      icon: <Globe className="w-6 h-6 text-purple-400" />,
      title: "Multi-language Support",
      description: "Support for 20+ languages with intelligent language detection"
    },
    {
      icon: <Zap className="w-6 h-6 text-orange-400" />,
      title: "Real-time Processing",
      description: "Low-latency AI processing for seamless live caption enhancement"
    },
    {
      icon: <Shield className="w-6 h-6 text-red-400" />,
      title: "Privacy-First",
      description: "Secure processing with no conversation data stored permanently"
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      title: "Collaboration Ready",
      description: "Share AI-enhanced captions with all meeting participants"
    },
    {
      icon: <Mic className="w-6 h-6 text-cyan-400" />,
      title: "Speaker Recognition",
      description: "Intelligent speaker identification and conversation threading"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-dark-1 text-white">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-yellow-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
            NVIDIA AI-Powered Captions
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Experience the future of video conferencing with intelligent, real-time caption enhancement 
          powered by NVIDIA&apos;s cutting-edge AI technology.
        </p>
      </div>

      {/* Demo Section */}
      <div className="mb-12">
        <Card className="bg-dark-2 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mic className="w-6 h-6" />
              Live AI Captions Demo
            </CardTitle>
            <CardDescription>
              Click the button below to start a live demonstration of AI-enhanced captions.
              Allow microphone access when prompted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => setIsDemo(!isDemo)}
                className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                  isDemo
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {isDemo ? 'Stop Demo' : 'Start AI Captions Demo'}
              </Button>
              
              {isDemo && (
                <div className="bg-dark-1 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Live Demo Active
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Speak into your microphone to see AI-enhanced captions in action. 
                    Try speaking in different languages or discussing complex topics.
                  </p>
                  <LiveCaptionsAI enableAI={true} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">AI Caption Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-dark-2 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Speech Recognition</h3>
                <p className="text-gray-300">
                  Browser-based Web Speech API captures audio and converts it to text in real-time
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Enhancement</h3>
                <p className="text-gray-300">
                  NVIDIA NIM processes the text using advanced language models to improve accuracy and context
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
                <p className="text-gray-300">
                  AI identifies key points, action items, and generates summaries automatically
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Real-time Display</h3>
                <p className="text-gray-300">
                  Enhanced captions are displayed instantly with confidence indicators and speaker identification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specs */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="bg-dark-2 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">AI Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-white">meta/llama-3.1-70b-instruct</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform:</span>
                <span className="text-white">NVIDIA NIM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Latency:</span>
                <span className="text-white">&lt; 2 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Accuracy:</span>
                <span className="text-white">95%+ enhancement</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-2 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Compatibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Browsers:</span>
                <span className="text-white">Chrome, Edge, Safari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Languages:</span>
                <span className="text-white">20+ supported</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Security:</span>
                <span className="text-white">HTTPS required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="text-white">Text, SRT, WebVTT</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready to Experience AI Captions?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join a meeting or start your personal room to experience the power of NVIDIA AI-enhanced captions.
            </p>
            <div className="space-x-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
                onClick={() => { window.location.href = '/'; }}
              >
                Start Meeting
              </Button>
              <Button
                variant="outline"
                className="border-gray-400 text-gray-300 hover:bg-gray-700 px-8 py-3"
                onClick={() => { window.location.href = '/personal-room'; }}
              >
                Personal Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}