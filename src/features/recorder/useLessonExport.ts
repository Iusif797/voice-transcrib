"use client";

import { useCallback, useRef, useState } from "react";
import { polishLesson } from "@/features/ai/polishClient";
import type { PolishedLesson } from "@/features/ai/types";
import { downloadBlob, safeFileName } from "@/features/audio/download";
import { encodeMp3 } from "@/features/audio/encodeMp3";
import { exportLessonPdf } from "@/features/pdf/exportLessonPdf";
import { extensionForMime, summaryFallback } from "./exportHelpers";

interface Params {
  title: string;
  transcript: string;
  durationMs: number;
  audioBlob: Blob | null;
}

type Job = "idle" | "polishing" | "mp3" | "pdf-full" | "pdf-summary";

export const useLessonExport = ({ title, transcript, durationMs, audioBlob }: Params) => {
  const [job, setJob] = useState<Job>("idle");
  const [error, setError] = useState<string | null>(null);
  const lessonRef = useRef<PolishedLesson | null>(null);

  const run = useCallback(async (next: Job, action: () => Promise<void>) => {
    setError(null);
    try {
      setJob(next);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось выполнить операцию");
    } finally {
      setJob("idle");
    }
  }, []);

  const downloadPdf = useCallback(
    (variant: "full" | "summary") =>
      run(variant === "summary" ? "pdf-summary" : "pdf-full", async () => {
        let pdfTitle = title.trim() || "Урок";
        let body: string;
        try {
          if (!lessonRef.current) {
            setJob("polishing");
            lessonRef.current = await polishLesson(title, transcript);
          }
          const lesson = lessonRef.current;
          pdfTitle = (lesson.title || title).trim() || pdfTitle;
          body = variant === "summary" ? lesson.summary : lesson.full;
        } catch {
          lessonRef.current = null;
          const raw = transcript.trim();
          if (!raw) throw new Error("Нет текста для PDF");
          body = variant === "summary" ? summaryFallback(raw) : raw;
        }
        await exportLessonPdf({
          title: pdfTitle,
          body,
          durationMs,
          createdAt: new Date(),
          variant,
        });
      }),
    [durationMs, run, title, transcript],
  );

  const downloadMp3 = useCallback(
    () =>
      run("mp3", async () => {
        if (!audioBlob) throw new Error("Сначала сделайте запись");
        try {
          const mp3 = await encodeMp3(audioBlob);
          downloadBlob(mp3, `${safeFileName(title)}.mp3`);
        } catch {
          downloadBlob(audioBlob, `${safeFileName(title)}.${extensionForMime(audioBlob.type || "")}`);
        }
      }),
    [audioBlob, run, title],
  );

  const clearLesson = useCallback(() => {
    lessonRef.current = null;
  }, []);

  return { job, error, downloadPdf, downloadMp3, clearLesson };
};
