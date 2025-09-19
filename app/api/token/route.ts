import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { StreamClient } from '@stream-io/node-sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Stream credentials missing' }, { status: 500 });
    }

    const client = new StreamClient(apiKey, apiSecret);
    const now = Math.floor(Date.now() / 1000);
    const token = client.createToken(user.id, now + 60 * 60, now - 60);

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Token route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
