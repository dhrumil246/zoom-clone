// app/api/nvidia-nim/speech-to-text/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createNimClient } from '@/lib/nvidia-nim/client';

export async function POST(request: NextRequest) {
  try {
    const { audioData, options } = await request.json();

    if (!audioData) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    const nimClient = createNimClient();
    const result = await nimClient.speechToText(audioData, options);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to process speech-to-text request' },
      { status: 500 }
    );
  }
}