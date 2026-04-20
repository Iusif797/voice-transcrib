"use client";

import { useState } from "react";
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

  const recording = session.status === "recording";
  const hasText = session.segments.length > 0;
  const hasVideo = Boolean(session.videoBlob);
  const busy = lesson.job !== "idle";

  const pdfLabel = (variant: "full" | "summary"): string => {
    if (lesson.job === "polishing") return "ИИ редактирует…";
    if (lesson.job === "pdf-full" && variant === "full") return "Готовим PDF…";
    if (lesson.job === "pdf-summary" && variant === "summary") return "Готовим PDF…";
    return variant === "summary" ? "PDF · кратко (2 стр)" : "PDF · полная версия";
  };

  const videoLabel = hasVideo
    ? `Скачать ${session.extension?.toUpperCase() ?? "видео"}`
    : "Скачать видео";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <TitleField value={title} onChange={setTitle} />
        <StatusBadge status={session.status} />
      </div>

      <VideoPreview stream={session.stream} recordedUrl={session.videoUrl} recording={recording} />

      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl md:text-5xl font-semibold tabular-nums tracking-tight">
          {formatDuration(session.elapsedMs)}
        </div>
        <RecordButton status={session.status} onStart={session.start} onStop={session.stop} />
        {(session.error || lesson.error) && (
          <p className="text-sm text-red-300/80 max-w-md text-center">{session.error ?? lesson.error}</p>
        )}
      </div>

      <TranscriptPanel segments={session.segments} interim={session.interim} recording={recording} />

      <ActionBar
        actions={[
          { label: pdfLabel("full"), onClick: () => lesson.downloadPdf("full"), disabled: !hasText || busy, tone: "primary" },
          { label: pdfLabel("summary"), onClick: () => lesson.downloadPdf("summary"), disabled: !hasText || busy, tone: "primary" },
          { label: videoLabel, onClick: videoExport.downloadVideo, disabled: !hasVideo || busy },
          { label: "Очистить", onClick: () => { session.clear(); lesson.clearLesson(); }, disabled: recording || (!hasText && !hasVideo), tone: "danger" },
        ]}
      />
    </div>
  );
};
