"use client";

import { useCallback, useState } from "react";
import type { TranscriptSegment } from "@/features/recorder/types";
import { saveLesson, type SavePhase } from "./lessonStore";
import type { LessonKind } from "./types";

interface SaveInput {
  title: string;
  kind: LessonKind;
  durationMs: number;
  transcript: string;
  segments: TranscriptSegment[];
  mediaBlob: Blob | null;
  mediaExtension: string | null;
  pdfFullBlob: Blob | null;
  pdfSummaryBlob: Blob | null;
}

export type SaveStatus =
  | "idle"
  | "preparing"
  | "uploading-media"
  | "uploading-pdf"
  | "saving"
  | "saved"
  | "error";

export const useLessonSaver = () => {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (input: SaveInput) => {
    if (!input.transcript.trim() && !input.mediaBlob && !input.pdfFullBlob && !input.pdfSummaryBlob) {
      setError("Нечего сохранять");
      setStatus("error");
      return null;
    }
    setError(null);
    const initialPhase: SaveStatus = input.mediaBlob
      ? "uploading-media"
      : input.pdfFullBlob || input.pdfSummaryBlob
        ? "uploading-pdf"
        : "saving";
    setStatus(initialPhase);
    try {
      const id = await saveLesson({
        ...input,
        onProgress: (phase: SavePhase) => setStatus(phase),
      });
      setStatus("saved");
      window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2400);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить урок");
      setStatus("error");
      return null;
    }
  }, []);

  const setPreparing = useCallback(() => {
    setError(null);
    setStatus("preparing");
  }, []);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, save, resetStatus, setPreparing };
};
