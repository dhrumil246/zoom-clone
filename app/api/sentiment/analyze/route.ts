// app/api/sentiment/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NvidiaSentimentClient } from '@/lib/nvidia-nim/sentiment';

export async function POST(request: NextRequest) {
  try {
    const { text, speakerContext } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
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
    const analysis = await sentimentClient.analyzeSentiment(text, speakerContext);

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}