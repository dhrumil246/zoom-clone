// app/api/sentiment/emotional-shifts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NvidiaSentimentClient, SentimentAnalysis } from '@/lib/nvidia-nim/sentiment';

export async function POST(request: NextRequest) {
  try {
    const { currentSentiment, previousSentiments } = await request.json();
    
    if (!currentSentiment) {
      return NextResponse.json(
        { error: 'Current sentiment is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(previousSentiments)) {
      return NextResponse.json(
        { error: 'Previous sentiments must be an array' },
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
    const shiftAnalysis = await sentimentClient.detectEmotionalShifts(
      currentSentiment as SentimentAnalysis,
      previousSentiments as SentimentAnalysis[]
    );

    return NextResponse.json({
      success: true,
      data: shiftAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Emotional shift analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze emotional shifts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}