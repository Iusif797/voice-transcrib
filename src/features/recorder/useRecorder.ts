"use client";

import { useCallback, useMemo, useState } from "react";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTimer } from "./useTimer";
import { useTranscriber } from "./useTranscriber";
import type { RecorderStatus } from "./types";

export const useRecorder = (lang: string) => {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const audio = useAudioRecorder();
  const transcriber = useTranscriber({ lang });
  const timer = useTimer(status === "recording");

  const start = useCallback(async () => {
    const granted = await audio.start();
    if (!granted) return;
    timer.reset();
    transcriber.reset();
    transcriber.start();
    setStatus("recording");
  }, [audio, timer, transcriber]);

  const stop = useCallback(() => {
    audio.stop();
    transcriber.stop();
    setStatus("idle");
  }, [audio, transcriber]);

  const clear = useCallback(() => {
    audio.reset();
    transcriber.reset();
    timer.reset();
    setStatus("idle");
  }, [audio, transcriber, timer]);

  const plainText = useMemo(
    () => transcriber.segments.map((segment) => segment.text).join(" ").trim(),
    [transcriber.segments],
  );

  return {
    status: transcriber.supported ? status : ("unsupported" as RecorderStatus),
    elapsedMs: timer.elapsedMs,
    segments: transcriber.segments,
    interim: transcriber.interim,
    audioUrl: audio.audioUrl,
    error: audio.error ?? transcriber.error,
    plainText,
    start,
    stop,
    clear,
  };
};
