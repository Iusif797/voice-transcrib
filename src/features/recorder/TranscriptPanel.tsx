"use client";

import { useEffect, useRef } from "react";
import type { TranscriptSegment } from "./types";

interface Props {
  segments: TranscriptSegment[];
  interim: string;
  recording: boolean;
}

export const TranscriptPanel = ({ segments, interim, recording }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [segments, interim]);

  const empty = segments.length === 0 && !interim;

  return (
    <div
      ref={scrollRef}
      className="glass rounded-3xl p-6 md:p-8 h-[360px] md:h-[440px] overflow-y-auto scrollbar-slim leading-relaxed text-[15px] md:text-base"
    >
      {empty ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-white/50 gap-2">
          <p className="text-lg font-medium text-white/70">Транскрипт появится здесь</p>
          <p className="text-sm max-w-sm">
            Нажмите на кнопку записи и начните говорить — слова будут распознаваться в реальном времени.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-white/90">
          {segments.map((segment) => (
            <p key={segment.id} className="whitespace-pre-wrap">
              {segment.text}
            </p>
          ))}
          {interim && (
            <p className="text-white/50 italic whitespace-pre-wrap">
              {interim}
              {recording && <span className="ml-1 inline-block h-4 w-0.5 bg-white/60 align-middle animate-pulse" />}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
