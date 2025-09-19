// app/api/sentiment/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NvidiaSentimentClient } from '@/lib/nvidia-nim/sentiment';

export async function POST(request: NextRequest) {
  try {
    const { conversations } = await request.json();
    
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return NextResponse.json(
        { error: 'Conversations array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate conversation format
    for (const conv of conversations) {
      if (!conv.text || !conv.timestamp) {
        return NextResponse.json(
          { error: 'Each conversation must have text and timestamp' },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NVIDIA API key not configured' },
        { status: 500 }
      );
    }

    const sentimentClient = new NvidiaSentimentClient(apiKey);
    
    // Convert timestamp strings to Date objects
    const processedConversations = conversations.map(conv => ({
      ...conv,
      timestamp: new Date(conv.timestamp),
    }));

    const summary = await sentimentClient.analyzeConversationFlow(processedConversations);

    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Conversation analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}