"use client";

import { useCallback, useMemo, useState } from "react";
import type { RecorderStatus } from "@/features/recorder/types";
import { useTimer } from "@/features/recorder/useTimer";
import { useTranscriber } from "@/features/recorder/useTranscriber";
import { useVideoRecorder } from "./useVideoRecorder";

export const useVideoSession = (lang: string) => {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const video = useVideoRecorder();
  const transcriber = useTranscriber({ lang });
  const timer = useTimer(status === "recording");

  const start = useCallback(async () => {
    const ok = await video.start();
    if (!ok) return;
    timer.reset();
    transcriber.reset();
    transcriber.start();
    setStatus("recording");
  }, [video, timer, transcriber]);

  const stop = useCallback(() => {
    video.stop();
    transcriber.stop();
    setStatus("idle");
  }, [video, transcriber]);

  const clear = useCallback(() => {
    video.reset();
    transcriber.reset();
    timer.reset();
    setStatus("idle");
  }, [video, transcriber, timer]);

  const plainText = useMemo(
    () => transcriber.segments.map((s) => s.text).join(" ").trim(),
    [transcriber.segments],
  );

  return {
    status: transcriber.supported ? status : ("unsupported" as RecorderStatus),
    elapsedMs: timer.elapsedMs,
    segments: transcriber.segments,
    interim: transcriber.interim,
    stream: video.stream,
    videoBlob: video.blob,
    videoUrl: video.url,
    extension: video.extension,
    error: video.error ?? transcriber.error,
    plainText,
    start,
    stop,
    clear,
  };
};
