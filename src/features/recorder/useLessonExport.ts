"use client";

import { useCallback, useRef, useState } from "react";
import { polishLesson } from "@/features/ai/polishClient";
import type { PolishedLesson } from "@/features/ai/types";
import { downloadBlob, safeFileName } from "@/features/audio/download";
import { encodeMp3 } from "@/features/audio/encodeMp3";
import { buildLessonPdfBlob, pdfFileName } from "@/features/pdf/exportLessonPdf";
import { extensionForMime, summaryFallback } from "./exportHelpers";

interface Params {
  title: string;
  transcript: string;
  durationMs: number;
  audioBlob: Blob | null;
}

type Job = "idle" | "polishing" | "mp3" | "pdf-full" | "pdf-summary";
type Variant = "full" | "summary";

export interface PdfArtifacts {
  full: Blob | null;
  summary: Blob | null;
}

export const useLessonExport = ({ title, transcript, durationMs, audioBlob }: Params) => {
  const [job, setJob] = useState<Job>("idle");
  const [error, setError] = useState<string | null>(null);
  const lessonRef = useRef<PolishedLesson | null>(null);
  const pdfRef = useRef<PdfArtifacts>({ full: null, summary: null });

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

  const ensurePolished = useCallback(async (): Promise<PolishedLesson | null> => {
    if (lessonRef.current) return lessonRef.current;
    setJob("polishing");
    try {
      lessonRef.current = await polishLesson(title, transcript);
      return lessonRef.current;
    } catch {
      lessonRef.current = null;
      return null;
    }
  }, [title, transcript]);

  const buildPdf = useCallback(
    async (variant: Variant): Promise<{ blob: Blob; pdfTitle: string } | null> => {
      let pdfTitle = title.trim() || "Урок";
      let body: string;
      const polished = await ensurePolished();
      if (polished) {
        pdfTitle = (polished.title || title).trim() || pdfTitle;
        body = variant === "summary" ? polished.summary : polished.full;
      } else {
        const raw = transcript.trim();
        if (!raw) return null;
        body = variant === "summary" ? summaryFallback(raw) : raw;
      }
      const blob = await buildLessonPdfBlob({
        title: pdfTitle,
        body,
        durationMs,
        createdAt: new Date(),
        variant,
      });
      pdfRef.current[variant] = blob;
      return { blob, pdfTitle };
    },
    [durationMs, ensurePolished, title, transcript],
  );

  const downloadPdf = useCallback(
    (variant: Variant) =>
      run(variant === "summary" ? "pdf-summary" : "pdf-full", async () => {
        const result = await buildPdf(variant);
        if (!result) throw new Error("Нет текста для PDF");
        downloadBlob(result.blob, pdfFileName(result.pdfTitle, variant));
      }),
    [buildPdf, run],
  );

  const ensurePdf = useCallback(
    async (variant: Variant): Promise<Blob | null> => {
      if (pdfRef.current[variant]) return pdfRef.current[variant];
      const result = await buildPdf(variant);
      return result?.blob ?? null;
    },
    [buildPdf],
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
    pdfRef.current = { full: null, summary: null };
  }, []);

  const getPdfArtifacts = useCallback((): PdfArtifacts => pdfRef.current, []);

  return { job, error, downloadPdf, downloadMp3, clearLesson, ensurePdf, getPdfArtifacts };
};
