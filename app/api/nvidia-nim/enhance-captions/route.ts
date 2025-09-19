// app/api/nvidia-nim/enhance-captions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createNimClient } from '@/lib/nvidia-nim/client';

export async function POST(request: NextRequest) {
  try {
    const { rawText, context, previousCaptions } = await request.json();

    if (!rawText) {
      return NextResponse.json(
        { error: 'Raw text is required' },
        { status: 400 }
      );
    }

    const nimClient = createNimClient();
    const enhancedText = await nimClient.enhanceCaptions(
      rawText,
      context || '',
      previousCaptions || []
    );

    return NextResponse.json({ result: enhancedText });
  } catch (error) {
    console.error('Caption enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance captions' },
      { status: 500 }
    );
  }
}