"use client";

import { useCallback, useState } from "react";
import type { TranscriptSegment } from "@/features/recorder/types";
import { generateLessonId, saveLesson } from "./lessonStore";
import type { LessonKind } from "./types";

interface SaveInput {
  title: string;
  kind: LessonKind;
  durationMs: number;
  transcript: string;
  segments: TranscriptSegment[];
  mediaBlob: Blob | null;
  mediaExtension: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export const useLessonSaver = () => {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async ({ title, kind, durationMs, transcript, segments, mediaBlob, mediaExtension }: SaveInput) => {
    if (!transcript.trim() && !mediaBlob) {
      setError("Нечего сохранять");
      setStatus("error");
      return null;
    }
    setStatus("saving");
    setError(null);
    try {
      const id = generateLessonId();
      await saveLesson({
        id,
        title: title.trim() || "Без названия",
        kind,
        createdAt: Date.now(),
        durationMs,
        transcript,
        segments,
        mediaMime: mediaBlob?.type ?? null,
        mediaExtension,
        mediaSize: mediaBlob?.size ?? 0,
        mediaBlob,
      });
      setStatus("saved");
      window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2200);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить урок");
      setStatus("error");
      return null;
    }
  }, []);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, save, resetStatus };
};
