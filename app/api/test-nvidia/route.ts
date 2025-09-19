// app/api/test-nvidia/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const NGC_API_KEY = process.env.NVIDIA_NIM_API_KEY;
    
    if (!NGC_API_KEY) {
      return NextResponse.json(
        { error: 'NVIDIA API key not configured' },
        { status: 500 }
      );
    }

    // Test LLM API Call using the exact format you provided
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NGC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with "NVIDIA NIM integration working correctly!" to test the connection.'
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API Error:', errorText);
      return NextResponse.json(
        { error: `NVIDIA API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: data.choices?.[0]?.message?.content || 'No response content',
      fullResponse: data,
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}