"use client";

import { useState } from "react";
import { useLessonSaver } from "@/features/lessons/useLessonSaver";
import { ActionBar } from "./ActionBar";
import { RecordButton } from "./RecordButton";
import { StatusBadge } from "./StatusBadge";
import { TitleField } from "./TitleField";
import { TranscriptPanel } from "./TranscriptPanel";
import { extensionForMime } from "./exportHelpers";
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
  const saver = useLessonSaver();
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const recording = recorder.status === "recording";
  const hasText = recorder.segments.length > 0;
  const hasAudio = Boolean(recorder.audioBlob);
  const exporterBusy = exporter.job !== "idle";

  const onSave = async () => {
    setPdfNotice(null);
    saver.setPreparing();
    let pdfFullBlob: Blob | null = null;
    let pdfSummaryBlob: Blob | null = null;
    if (hasText) {
      pdfFullBlob = await exporter.ensurePdf("full");
      pdfSummaryBlob = await exporter.ensurePdf("summary");
      if (!pdfFullBlob || !pdfSummaryBlob) {
        setPdfNotice("PDF не удалось сгенерировать (проверьте AI-ключ). Урок сохранится с медиа и транскриптом.");
      }
    }
    await saver.save({
      title,
      kind: "audio",
      durationMs: recorder.elapsedMs,
      transcript: recorder.plainText,
      segments: recorder.segments,
      mediaBlob: recorder.audioBlob,
      mediaExtension: recorder.audioBlob ? extensionForMime(recorder.audioBlob.type || "") : null,
      pdfFullBlob,
      pdfSummaryBlob,
    });
  };

  const saveLabel = (() => {
    switch (saver.status) {
      case "preparing": return "Готовим PDF…";
      case "uploading-media": return "Загружаем аудио…";
      case "uploading-pdf": return "Загружаем PDF…";
      case "saving": return "Сохраняем…";
      case "saved": return "Сохранено ✓";
      default: return "Сохранить урок";
    }
  })();

  const saveBusy = saver.status !== "idle" && saver.status !== "saved" && saver.status !== "error";

  const labelFor = (variant: "full" | "summary"): string => {
    if (exporter.job === "polishing") return "ИИ редактирует…";
    if (exporter.job === "pdf-full" && variant === "full") return "Готовим PDF…";
    if (exporter.job === "pdf-summary" && variant === "summary") return "Готовим PDF…";
    return variant === "summary" ? "PDF · кратко (2 стр)" : "PDF · полная версия";
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-8 py-8 md:py-12 flex flex-col gap-8">
      <div className="flex justify-end">
        <StatusBadge status={recorder.status} />
      </div>

      <section className="flex flex-col items-center gap-6 text-center">
        <TitleField value={title} onChange={setTitle} />
        <div className="text-5xl md:text-6xl font-semibold tabular-nums tracking-tight">
          {formatDuration(recorder.elapsedMs)}
        </div>
        <RecordButton status={recorder.status} onStart={recorder.start} onStop={recorder.stop} />
        {(recorder.error || exporter.error || saver.error) && (
          <p className="text-sm text-red-300/80 max-w-md">
            {[recorder.error, exporter.error, saver.error].filter(Boolean).join(" · ")}
          </p>
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
          { label: labelFor("full"), onClick: () => exporter.downloadPdf("full"), disabled: !hasText || exporterBusy, tone: "primary" },
          { label: labelFor("summary"), onClick: () => exporter.downloadPdf("summary"), disabled: !hasText || exporterBusy, tone: "primary" },
          { label: exporter.job === "mp3" ? "Кодируем MP3…" : "Скачать MP3", onClick: exporter.downloadMp3, disabled: !hasAudio || exporterBusy },
          { label: saveLabel, onClick: onSave, disabled: recording || saveBusy || (!hasText && !hasAudio), tone: "primary" },
          { label: "Очистить", onClick: () => { recorder.clear(); exporter.clearLesson(); saver.resetStatus(); setPdfNotice(null); }, disabled: recording || (!hasText && !hasAudio), tone: "danger" },
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

      {recorder.audioUrl && <audio controls src={recorder.audioUrl} className="w-full mt-2 rounded-xl" />}
    </main>
  );
};
