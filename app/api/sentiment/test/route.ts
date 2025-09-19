// app/api/sentiment/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NvidiaSentimentClient } from '@/lib/nvidia-nim/sentiment';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NVIDIA API key not configured' },
        { status: 500 }
      );
    }

    const sentimentClient = new NvidiaSentimentClient(apiKey);
    
    // Test with sample text
    const testText = "I'm really excited about this new project! It's going to be amazing.";
    const analysis = await sentimentClient.analyzeSentiment(testText, "Test Speaker");

    // Test conversation analysis
    const testConversations = [
      {
        text: "I love this new feature we're building!",
        speaker: "Alice",
        timestamp: new Date(Date.now() - 300000)
      },
      {
        text: "I'm not sure about the timeline though.",
        speaker: "Bob", 
        timestamp: new Date(Date.now() - 240000)
      },
      {
        text: "Let's work together to make it happen!",
        speaker: "Charlie",
        timestamp: new Date(Date.now() - 180000)
      }
    ];

    const conversationSummary = await sentimentClient.analyzeConversationFlow(testConversations);

    return NextResponse.json({
      success: true,
      message: 'NVIDIA Sentiment Analysis API is working correctly',
      data: {
        singleAnalysis: analysis,
        conversationAnalysis: conversationSummary,
        apiEndpoint: 'https://integrate.api.nvidia.com/v1',
        model: 'meta/llama-3.1-8b-instruct',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Sentiment API test error:', error);
    return NextResponse.json(
      { 
        error: 'Sentiment analysis test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        apiKey: process.env.NVIDIA_NIM_API_KEY ? 'Present' : 'Missing'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required for testing' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NVIDIA API key not configured' },
        { status: 500 }
      );
    }

    const sentimentClient = new NvidiaSentimentClient(apiKey);
    const analysis = await sentimentClient.analyzeSentiment(text, "Test User");

    return NextResponse.json({
      success: true,
      message: 'Custom text analysis completed',
      data: {
        inputText: text,
        analysis: analysis,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Custom sentiment test error:', error);
    return NextResponse.json(
      { 
        error: 'Custom sentiment analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}