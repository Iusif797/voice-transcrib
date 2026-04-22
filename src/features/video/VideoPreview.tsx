"use client";

import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream | null;
  recordedUrl: string | null;
  recording: boolean;
}

export const VideoPreview = ({ stream, recordedUrl, recording }: Props) => {
  const liveRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = liveRef.current;
    if (!node) return;
    node.srcObject = stream;
    if (stream) node.play().catch(() => undefined);
  }, [stream]);

  const showLive = recording && stream;
  const showPlayback = !recording && recordedUrl;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass flex items-center justify-center aspect-[3/4] sm:aspect-video min-h-[60vh] sm:min-h-0">
      {showLive && (
        <video
          ref={liveRef}
          muted
          playsInline
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {showPlayback && (
        <video
          controls
          playsInline
          src={recordedUrl}
          className="absolute inset-0 h-full w-full object-contain bg-black"
        />
      )}
      {!showLive && !showPlayback && (
        <div className="text-center text-white/50 px-6">
          <p className="text-lg font-medium text-white/70">Видео появится здесь</p>
          <p className="text-sm mt-1">Нажмите на кнопку записи — камера и микрофон активируются.</p>
        </div>
      )}
      {recording && (
        <span className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-500/80 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          REC
        </span>
      )}
    </div>
  );
};
