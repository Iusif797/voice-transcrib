"use client";

import { useState } from "react";
import { ActionBar } from "./ActionBar";
import { RecordButton } from "./RecordButton";
import { StatusBadge } from "./StatusBadge";
import { TitleField } from "./TitleField";
import { TranscriptPanel } from "./TranscriptPanel";
import { formatDuration } from "./format";
import { useLessonExport } from "./useLessonExport";
import { useRecorder } from "./useRecorder";

const DEFAULT_LANG = "ru-RU";

export const RecorderView = () => {
  const [title, setTitle] = useState("Новый урок");
  const recorder = useRecorder(DEFAULT_LANG);
  const exporter = useLessonExport({
    title,
    transcript: recorder.plainText,
    durationMs: recorder.elapsedMs,
    audioBlob: recorder.audioBlob,
  });

  const recording = recorder.status === "recording";
  const hasText = recorder.segments.length > 0;
  const hasAudio = Boolean(recorder.audioBlob);
  const busy = exporter.job !== "idle";

  const labelFor = (variant: "full" | "summary"): string => {
    if (exporter.job === "polishing") return "ИИ редактирует…";
    if (exporter.job === "pdf-full" && variant === "full") return "Готовим PDF…";
    if (exporter.job === "pdf-summary" && variant === "summary") return "Готовим PDF…";
    return variant === "summary" ? "PDF · кратко (2 стр)" : "PDF · полная версия";
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-16 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.8)]" />
          <span className="font-semibold tracking-tight">VoiceScribe</span>
        </div>
        <StatusBadge status={recorder.status} />
      </header>

      <section className="flex flex-col items-center gap-6 text-center">
        <TitleField value={title} onChange={setTitle} />
        <div className="text-5xl md:text-6xl font-semibold tabular-nums tracking-tight">
          {formatDuration(recorder.elapsedMs)}
        </div>
        <RecordButton status={recorder.status} onStart={recorder.start} onStop={recorder.stop} />
        {(recorder.error || exporter.error) && (
          <p className="text-sm text-red-300/80 max-w-md">{recorder.error ?? exporter.error}</p>
        )}
        {recorder.status === "unsupported" && (
          <p className="text-sm text-amber-300/80 max-w-md">
            Ваш браузер не поддерживает распознавание речи. Откройте приложение в Chrome или Edge.
          </p>
        )}
      </section>

      <TranscriptPanel segments={recorder.segments} interim={recorder.interim} recording={recording} />

      <ActionBar
        actions={[
          { label: labelFor("full"), onClick: () => exporter.downloadPdf("full"), disabled: !hasText || busy, tone: "primary" },
          { label: labelFor("summary"), onClick: () => exporter.downloadPdf("summary"), disabled: !hasText || busy, tone: "primary" },
          { label: exporter.job === "mp3" ? "Кодируем MP3…" : "Скачать MP3", onClick: exporter.downloadMp3, disabled: !hasAudio || busy },
          { label: "Очистить", onClick: () => { recorder.clear(); exporter.clearLesson(); }, disabled: recording || (!hasText && !hasAudio), tone: "danger" },
        ]}
      />

      {recorder.audioUrl && <audio controls src={recorder.audioUrl} className="w-full mt-2 rounded-xl" />}
    </main>
  );
};
