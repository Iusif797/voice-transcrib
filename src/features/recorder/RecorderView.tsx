"use client";

import { useState } from "react";
import { exportToPdf } from "@/features/pdf/exportToPdf";
import { ActionBar } from "./ActionBar";
import { RecordButton } from "./RecordButton";
import { StatusBadge } from "./StatusBadge";
import { TitleField } from "./TitleField";
import { TranscriptPanel } from "./TranscriptPanel";
import { formatDuration } from "./format";
import { useRecorder } from "./useRecorder";

const DEFAULT_LANG = "ru-RU";

export const RecorderView = () => {
  const [title, setTitle] = useState("Новый урок");
  const [exporting, setExporting] = useState(false);
  const recorder = useRecorder(DEFAULT_LANG);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPdf({
        title: title.trim() || "Урок",
        segments: recorder.segments,
        durationMs: recorder.elapsedMs,
        createdAt: new Date(),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!recorder.plainText) return;
    await navigator.clipboard.writeText(recorder.plainText);
  };

  const recording = recorder.status === "recording";
  const hasContent = recorder.segments.length > 0;

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
        <RecordButton
          status={recorder.status}
          onStart={recorder.start}
          onStop={recorder.stop}
        />
        {recorder.error && (
          <p className="text-sm text-red-300/80">{recorder.error}</p>
        )}
        {recorder.status === "unsupported" && (
          <p className="text-sm text-amber-300/80 max-w-md">
            Ваш браузер не поддерживает распознавание речи. Откройте приложение в Chrome или Edge.
          </p>
        )}
      </section>

      <TranscriptPanel
        segments={recorder.segments}
        interim={recorder.interim}
        recording={recording}
      />

      <ActionBar
        actions={[
          {
            label: exporting ? "Готовим PDF…" : "Скачать PDF",
            onClick: handleExport,
            disabled: !hasContent || exporting,
            tone: "primary",
          },
          {
            label: "Копировать текст",
            onClick: handleCopy,
            disabled: !hasContent,
          },
          {
            label: "Очистить",
            onClick: recorder.clear,
            disabled: recording || (!hasContent && recorder.elapsedMs === 0),
            tone: "danger",
          },
        ]}
      />

      {recorder.audioUrl && (
        <audio
          controls
          src={recorder.audioUrl}
          className="w-full mt-2 rounded-xl"
        />
      )}
    </main>
  );
};
