"use client";

import { useMemo, useState } from "react";
import { downloadBlob, safeFileName } from "@/features/audio/download";
import { formatDuration } from "@/features/recorder/format";
import { formatBytes, formatTime, groupLessonsByDay } from "./dateGroups";
import { fetchAttachmentBlob, getLesson } from "./lessonStore";
import { useLessonsList } from "./useLessonsList";
import type { LessonAttachment, LessonSummary } from "./types";

const KIND_LABEL: Record<LessonSummary["kind"], string> = {
  audio: "Аудио",
  video: "Видео",
};

interface FileButton {
  key: string;
  label: string;
  attachment: LessonAttachment;
  filename: string;
  variant: "primary" | "ghost";
}

const buildFileButtons = (lesson: LessonSummary): FileButton[] => {
  const slug = safeFileName(lesson.title);
  const buttons: FileButton[] = [];
  if (lesson.media) {
    const ext = lesson.media.extension ?? (lesson.kind === "video" ? "webm" : "webm");
    buttons.push({
      key: "media",
      label: `${lesson.kind === "video" ? "Видео" : "Аудио"} · ${ext.toUpperCase()}`,
      attachment: lesson.media,
      filename: `${slug}.${ext}`,
      variant: "primary",
    });
  }
  if (lesson.pdfFull) {
    buttons.push({
      key: "pdf-full",
      label: "PDF · полный",
      attachment: lesson.pdfFull,
      filename: `${slug}_полный.pdf`,
      variant: "ghost",
    });
  }
  if (lesson.pdfSummary) {
    buttons.push({
      key: "pdf-summary",
      label: "PDF · кратко",
      attachment: lesson.pdfSummary,
      filename: `${slug}_кратко.pdf`,
      variant: "ghost",
    });
  }
  return buttons;
};

const totalAttachmentSize = (lesson: LessonSummary): number =>
  (lesson.media?.size ?? 0) + (lesson.pdfFull?.size ?? 0) + (lesson.pdfSummary?.size ?? 0);

const buttonClasses = (variant: "primary" | "ghost"): string =>
  variant === "primary"
    ? "px-3 py-1.5 rounded-lg text-xs bg-white text-black hover:bg-white/90 disabled:opacity-50"
    : "px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/85 hover:bg-white/10 border border-white/10 disabled:opacity-50";

export const LessonsView = () => {
  const { lessons, loading, error, remove, refresh } = useLessonsList();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>("");

  const groups = useMemo(() => groupLessonsByDay(lessons), [lessons]);

  const onDownloadFile = async (lessonId: string, button: FileButton) => {
    const key = `${lessonId}:${button.key}`;
    setBusyKey(key);
    try {
      const blob = await fetchAttachmentBlob(button.attachment.path);
      downloadBlob(blob, button.filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось скачать файл");
    } finally {
      setBusyKey(null);
    }
  };

  const onDownloadText = async (summary: LessonSummary) => {
    const key = `${summary.id}:txt`;
    setBusyKey(key);
    try {
      const record = await getLesson(summary.id);
      if (!record) return;
      const blob = new Blob([record.transcript], { type: "text/plain;charset=utf-8" });
      downloadBlob(blob, `${safeFileName(record.title)}.txt`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось скачать транскрипт");
    } finally {
      setBusyKey(null);
    }
  };

  const onToggle = async (summary: LessonSummary) => {
    if (expandedId === summary.id) {
      setExpandedId(null);
      setPreviewText("");
      return;
    }
    setExpandedId(summary.id);
    setPreviewText("Загрузка…");
    try {
      const record = await getLesson(summary.id);
      setPreviewText(record?.transcript?.trim() || "Транскрипт пуст");
    } catch (err) {
      setPreviewText(err instanceof Error ? err.message : "Не удалось загрузить транскрипт");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Удалить урок и все его файлы безвозвратно?")) return;
    try {
      await remove(id);
      if (expandedId === id) {
        setExpandedId(null);
        setPreviewText("");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось удалить урок");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Сохранённые уроки</h1>
          <p className="text-sm text-white/60 mt-1">
            Уроки сгруппированы по датам. Медиа и PDF хранятся в облаке (Supabase).
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="px-3 py-1.5 rounded-xl text-sm bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
        >
          Обновить
        </button>
      </header>

      {loading && <p className="text-sm text-white/60">Загрузка…</p>}
      {error && <p className="text-sm text-red-300/80">{error}</p>}

      {!loading && !error && lessons.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-white/70">
          <p className="text-lg font-medium text-white/85">Пока нет сохранённых уроков</p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            Запишите аудио или видео, нажмите «Сохранить» — урок появится здесь со всеми файлами (медиа + PDF).
          </p>
        </div>
      )}

      {groups.map((group) => {
        const groupSize = group.lessons.reduce((sum, l) => sum + totalAttachmentSize(l), 0);
        return (
          <section key={group.key} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wide">{group.label}</h2>
              <span className="text-xs text-white/40">
                {group.lessons.length} {group.lessons.length === 1 ? "урок" : "уроков"}
                {groupSize > 0 ? ` · ${formatBytes(groupSize)}` : ""}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {group.lessons.map((lesson) => {
                const expanded = expandedId === lesson.id;
                const fileButtons = buildFileButtons(lesson);
                const totalSize = totalAttachmentSize(lesson);
                return (
                  <article key={lesson.id} className="glass rounded-2xl p-4 md:p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            lesson.kind === "video" ? "bg-violet-500/15 text-violet-200" : "bg-blue-500/15 text-blue-200"
                          }`}>
                            {KIND_LABEL[lesson.kind]}
                          </span>
                          <span className="text-xs text-white/50">{formatTime(lesson.createdAt)}</span>
                          <span className="text-xs text-white/50">· {formatDuration(lesson.durationMs)}</span>
                          {totalSize > 0 && (
                            <span className="text-xs text-white/50">· {formatBytes(totalSize)}</span>
                          )}
                          <span className="text-xs text-white/50">· {fileButtons.length} файл(ов)</span>
                        </div>
                        <h3 className="text-base md:text-lg font-medium text-white/90 mt-1.5 break-words">
                          {lesson.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggle(lesson)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
                        >
                          {expanded ? "Скрыть" : "Просмотр"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(lesson.id)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-400/20"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    {(fileButtons.length > 0 || lesson.transcriptLength > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                        {fileButtons.map((button) => {
                          const key = `${lesson.id}:${button.key}`;
                          const busy = busyKey === key;
                          return (
                            <button
                              key={button.key}
                              type="button"
                              onClick={() => onDownloadFile(lesson.id, button)}
                              disabled={busy}
                              className={buttonClasses(button.variant)}
                              title={`${formatBytes(button.attachment.size)}`}
                            >
                              {busy ? "…" : `↓ ${button.label}`}
                            </button>
                          );
                        })}
                        {lesson.kind === "video" && lesson.media?.url && (
                          <a
                            href={lesson.media.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
                          >
                            ▶ Открыть
                          </a>
                        )}
                        {lesson.transcriptLength > 0 && (
                          <button
                            type="button"
                            onClick={() => onDownloadText(lesson)}
                            disabled={busyKey === `${lesson.id}:txt`}
                            className={buttonClasses("ghost")}
                          >
                            {busyKey === `${lesson.id}:txt` ? "…" : "↓ .txt"}
                          </button>
                        )}
                      </div>
                    )}

                    {expanded && (
                      <div className="rounded-xl bg-black/30 border border-white/5 p-4 max-h-72 overflow-y-auto scrollbar-slim text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
                        {previewText}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
