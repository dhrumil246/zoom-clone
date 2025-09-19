// components/captions/CaptionCollaboration.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from '../ui/button';
import { Share2, Users } from 'lucide-react';
import { TranscriptEntry } from '@/lib/captions/types';
import { cn } from '@/lib/utils';

interface CaptionCollaborationProps {
  transcript: TranscriptEntry[];
  sessionId?: string;
  canShare?: boolean; // whether local env supports capturing audio
}

type RemoteCaption = {
  userId: string;
  text: string;
  isFinal: boolean;
  lang?: string;
  ts: number;
  name?: string;
};

export default function CaptionCollaboration({
  transcript,
  sessionId,
  canShare = true,
}: CaptionCollaborationProps) {
  const call = useCall();
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();

  const [isSharing, setIsSharing] = useState(false);
  const [remoteCaptions, setRemoteCaptions] = useState<Record<string, RemoteCaption>>({});
  const cleanupTimers = useRef<Record<string, any>>({});

  // Broadcast caption updates to other participants (final only)
  useEffect(() => {
    if (!call || !isSharing) return;
    const latestEntry = transcript[transcript.length - 1];
    if (!latestEntry || !latestEntry.isFinal) return;

    try {
      call.sendCustomEvent({
        type: 'caption-update',
        data: {
          sessionId: sessionId ?? null,
          text: latestEntry.text,
          isFinal: true,
          lang: latestEntry?.speaker ? undefined : undefined,
          ts: Date.now(),
          sender: localParticipant?.userId,
        },
      });
    } catch (e) {
      // ignore send errors
      // eslint-disable-next-line no-console
      console.warn('Failed to send caption-update', e);
    }
  }, [transcript, call, isSharing, sessionId, localParticipant?.userId]);

  // Listen for caption updates from others
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event: any) => {
      if (event?.type !== 'caption-update') return;
      const data = event?.data || {};
      const senderId: string | undefined = data.sender;
      if (!senderId || senderId === localParticipant?.userId) return;

      const sender = participants.find((p) => p.userId === senderId);
      const name = sender?.name || sender?.userId || 'Participant';

      setRemoteCaptions((prev) => ({
        ...prev,
        [senderId]: {
          userId: senderId,
          text: String(data.text || '').trim(),
          isFinal: !!data.isFinal,
          lang: data.lang,
          ts: Number(data.ts || Date.now()),
          name,
        },
      }));

      // Auto-clear each remote caption after 6s
      if (cleanupTimers.current[senderId]) {
        clearTimeout(cleanupTimers.current[senderId]);
      }
      cleanupTimers.current[senderId] = setTimeout(() => {
        setRemoteCaptions((prev) => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
      }, 6000);
    };

    call.on('custom', handleCustomEvent);
    return () => {
      call.off('custom', handleCustomEvent);
      Object.values(cleanupTimers.current).forEach((t) => clearTimeout(t));
      cleanupTimers.current = {};
    };
  }, [call, participants, localParticipant?.userId]);

  const handleShareCaptions = () => {
    setIsSharing((v) => !v);
  };

  const othersCount = useMemo(() => Math.max(0, participants.length - 1), [participants.length]);

  return (
    <>
      {/* Share toggle in controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleShareCaptions}
          disabled={!canShare}
          className={`rounded-2xl px-3 py-2 ${
            !canShare
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : isSharing
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-[#19232d] hover:bg-[#4c535b]'
          }`}
          title={!canShare ? 'Enable local captions to share' : 'Share your captions with others'}
        >
          <Share2 size={16} className="mr-1" />
          {isSharing ? 'Sharing' : 'Share'}
        </Button>

        <div className="flex items-center gap-1 px-2 py-1 bg-[#19232d] rounded-lg">
          <Users size={14} />
          <span className="text-xs">{othersCount}</span>
        </div>
      </div>

      {/* Remote captions overlay */}
      {Object.keys(remoteCaptions).length > 0 && (
        <div className={cn(
          'fixed z-50 left-1/2 -translate-x-1/2 bottom-40 w-[80%] max-w-3xl space-y-2'
        )}>
          {Object.values(remoteCaptions)
            .sort((a, b) => a.ts - b.ts)
            .map((rc) => (
              <div
                key={rc.userId}
                className={cn(
                  'px-4 py-2 rounded-lg bg-black/60 text-white text-sm shadow-md border border-white/10'
                )}
              >
                <span className="font-semibold mr-2 opacity-90">{rc.name}:</span>
                <span className="opacity-95">{rc.text}</span>
              </div>
            ))}
        </div>
      )}
    </>
  );
}