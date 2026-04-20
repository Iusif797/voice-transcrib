"use client";

import { useCallback, useRef, useState } from "react";
import { polishLesson } from "@/features/ai/polishClient";
import type { PolishedLesson } from "@/features/ai/types";
import { downloadBlob, safeFileName } from "@/features/audio/download";
import { encodeMp3 } from "@/features/audio/encodeMp3";
import { exportLessonPdf } from "@/features/pdf/exportLessonPdf";

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

  const ensureLesson = useCallback(async (): Promise<PolishedLesson> => {
    if (lessonRef.current) return lessonRef.current;
    setJob("polishing");
    const lesson = await polishLesson(title, transcript);
    lessonRef.current = lesson;
    return lesson;
  }, [title, transcript]);

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
        const lesson = await ensureLesson();
        await exportLessonPdf({
          title: lesson.title || title,
          body: variant === "summary" ? lesson.summary : lesson.full,
          durationMs,
          createdAt: new Date(),
          variant,
        });
      }),
    [ensureLesson, durationMs, run, title],
  );

  const downloadMp3 = useCallback(
    () =>
      run("mp3", async () => {
        if (!audioBlob) throw new Error("Сначала сделайте запись");
        const mp3 = await encodeMp3(audioBlob);
        downloadBlob(mp3, `${safeFileName(title)}.mp3`);
      }),
    [audioBlob, run, title],
  );

  const clearLesson = useCallback(() => {
    lessonRef.current = null;
  }, []);

  return { job, error, downloadPdf, downloadMp3, clearLesson };
};
