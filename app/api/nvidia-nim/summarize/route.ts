// app/api/nvidia-nim/summarize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createNimClient } from '@/lib/nvidia-nim/client';

export async function POST(request: NextRequest) {
  try {
    const { transcript, type = 'summary' } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const nimClient = createNimClient();
    
    let result: string | string[];
    
    switch (type) {
      case 'summary':
        result = await nimClient.generateMeetingSummary(transcript);
        break;
      case 'action-items':
        result = await nimClient.extractActionItems(transcript);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use "summary" or "action-items"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to process summarization request' },
      { status: 500 }
    );
  }
}