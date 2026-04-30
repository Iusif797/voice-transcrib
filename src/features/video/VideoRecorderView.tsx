"use client";

import { useState } from "react";
import { useLessonSaver } from "@/features/lessons/useLessonSaver";
import { ActionBar } from "@/features/recorder/ActionBar";
import { RecordButton } from "@/features/recorder/RecordButton";
import { StatusBadge } from "@/features/recorder/StatusBadge";
import { TitleField } from "@/features/recorder/TitleField";
import { TranscriptPanel } from "@/features/recorder/TranscriptPanel";
import { formatDuration } from "@/features/recorder/format";
import { useLessonExport } from "@/features/recorder/useLessonExport";
import { VideoPreview } from "./VideoPreview";
import { useVideoExport } from "./useVideoExport";
import { useVideoSession } from "./useVideoSession";

const LANG = "ru-RU";

export const VideoRecorderView = () => {
  const [title, setTitle] = useState("Новый видео-урок");
  const session = useVideoSession(LANG);
  const lesson = useLessonExport({
    title,
    transcript: session.plainText,
    durationMs: session.elapsedMs,
    audioBlob: null,
  });
  const videoExport = useVideoExport({
    title,
    blob: session.videoBlob,
    extension: session.extension,
  });
  const saver = useLessonSaver();
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const recording = session.status === "recording";
  const hasText = session.segments.length > 0;
  const hasVideo = Boolean(session.videoBlob);
  const exporterBusy = lesson.job !== "idle";

  const onSave = async () => {
    setPdfNotice(null);
    saver.setPreparing();
    let pdfFullBlob: Blob | null = null;
    let pdfSummaryBlob: Blob | null = null;
    if (hasText) {
      pdfFullBlob = await lesson.ensurePdf("full");
      pdfSummaryBlob = await lesson.ensurePdf("summary");
      if (!pdfFullBlob || !pdfSummaryBlob) {
        setPdfNotice("PDF не удалось сгенерировать (проверьте AI-ключ). Урок сохранится с видео и транскриптом.");
      }
    }
    await saver.save({
      title,
      kind: "video",
      durationMs: session.elapsedMs,
      transcript: session.plainText,
      segments: session.segments,
      mediaBlob: session.videoBlob,
      mediaExtension: session.extension,
      pdfFullBlob,
      pdfSummaryBlob,
    });
  };

  const saveLabel = (() => {
    switch (saver.status) {
      case "preparing": return "Готовим PDF…";
      case "uploading-media": return "Загружаем видео…";
      case "uploading-pdf": return "Загружаем PDF…";
      case "saving": return "Сохраняем…";
      case "saved": return "Сохранено ✓";
      default: return "Сохранить урок";
    }
  })();

  const saveBusy = saver.status !== "idle" && saver.status !== "saved" && saver.status !== "error";

  const pdfLabel = (variant: "full" | "summary"): string => {
    if (lesson.job === "polishing") return "ИИ редактирует…";
    if (lesson.job === "pdf-full" && variant === "full") return "Готовим PDF…";
    if (lesson.job === "pdf-summary" && variant === "summary") return "Готовим PDF…";
    return variant === "summary" ? "PDF · кратко (2 стр)" : "PDF · полная версия";
  };

  const videoLabel = videoExport.busy
    ? "Готовим файл…"
    : session.finalizing
      ? "Финализируем видео…"
      : hasVideo
        ? `Скачать ${session.extension?.toUpperCase() ?? "видео"}`
        : "Скачать видео";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <TitleField value={title} onChange={setTitle} />
        <StatusBadge status={session.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_auto] gap-6 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <VideoPreview stream={session.stream} recordedUrl={session.videoUrl} recording={recording} />
          <TranscriptPanel segments={session.segments} interim={session.interim} recording={recording} />
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col items-center gap-4 md:sticky md:top-24 md:w-[min(100%,280px)] shrink-0">
          <div className="text-4xl md:text-5xl font-semibold tabular-nums tracking-tight">
            {formatDuration(session.elapsedMs)}
          </div>
          <RecordButton status={session.status} onStart={session.start} onStop={session.stop} />
            {(session.error || lesson.error || saver.error) && (
              <p className="text-sm text-red-300/80 text-center">
                {[session.error, lesson.error, saver.error].filter(Boolean).join(" · ")}
              </p>
            )}
        </div>
      </div>

      <ActionBar
        actions={[
          { label: pdfLabel("full"), onClick: () => lesson.downloadPdf("full"), disabled: !hasText || exporterBusy, tone: "primary" },
          { label: pdfLabel("summary"), onClick: () => lesson.downloadPdf("summary"), disabled: !hasText || exporterBusy, tone: "primary" },
          { label: videoLabel, onClick: videoExport.downloadVideo, disabled: !hasVideo || videoExport.busy || exporterBusy },
          { label: saveLabel, onClick: onSave, disabled: recording || saveBusy || (!hasText && !hasVideo), tone: "primary" },
          { label: "Очистить", onClick: () => { session.clear(); lesson.clearLesson(); saver.resetStatus(); setPdfNotice(null); }, disabled: recording || (!hasText && !hasVideo), tone: "danger" },
        ]}
      />

      {saver.status === "saved" && (
        <p className="text-sm text-emerald-300/90 text-center">
          Урок сохранён. Открыть список можно во вкладке «Уроки».
        </p>
      )}
      {pdfNotice && (
        <p className="text-xs text-amber-300/80 text-center">{pdfNotice}</p>
      )}
    </div>
  );
};
