"use client";

import { useMemo, useState } from "react";
import { downloadBlob, safeFileName } from "@/features/audio/download";
import { formatDuration } from "@/features/recorder/format";
import { formatBytes, formatTime, groupLessonsByDay } from "./dateGroups";
import { getLesson } from "./lessonStore";
import { useLessonsList } from "./useLessonsList";
import type { LessonSummary } from "./types";

const KIND_LABEL: Record<LessonSummary["kind"], string> = {
  audio: "Аудио",
  video: "Видео",
};

export const LessonsView = () => {
  const { lessons, loading, error, remove, refresh } = useLessonsList();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>("");

  const groups = useMemo(() => groupLessonsByDay(lessons), [lessons]);

  const onDownloadMedia = async (summary: LessonSummary) => {
    if (!summary.mediaSize || !summary.mediaExtension) return;
    setBusyId(summary.id);
    try {
      const record = await getLesson(summary.id);
      if (record?.mediaBlob) {
        downloadBlob(record.mediaBlob, `${safeFileName(record.title)}.${summary.mediaExtension}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const onDownloadText = async (summary: LessonSummary) => {
    setBusyId(summary.id);
    try {
      const record = await getLesson(summary.id);
      if (!record) return;
      const blob = new Blob([record.transcript], { type: "text/plain;charset=utf-8" });
      downloadBlob(blob, `${safeFileName(record.title)}.txt`);
    } finally {
      setBusyId(null);
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
    const record = await getLesson(summary.id);
    setPreviewText(record?.transcript?.trim() || "Транскрипт пуст");
  };

  const onDelete = async (id: string) => {
    if (!confirm("Удалить урок безвозвратно?")) return;
    await remove(id);
    if (expandedId === id) {
      setExpandedId(null);
      setPreviewText("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Сохранённые уроки</h1>
          <p className="text-sm text-white/60 mt-1">Уроки сгруппированы по датам. Хранятся локально в браузере.</p>
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

      {!loading && lessons.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-white/70">
          <p className="text-lg font-medium text-white/85">Пока нет сохранённых уроков</p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            Запишите аудио или видео, нажмите «Сохранить» — урок появится здесь и будет доступен по дате.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wide px-1">{group.label}</h2>
          <div className="flex flex-col gap-2">
            {group.lessons.map((lesson) => {
              const expanded = expandedId === lesson.id;
              const busy = busyId === lesson.id;
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
                        {lesson.mediaSize > 0 && (
                          <span className="text-xs text-white/50">
                            · {formatBytes(lesson.mediaSize)}
                            {lesson.mediaExtension ? ` ${lesson.mediaExtension.toUpperCase()}` : ""}
                          </span>
                        )}
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
                      {lesson.transcriptLength > 0 && (
                        <button
                          type="button"
                          onClick={() => onDownloadText(lesson)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 disabled:opacity-50"
                        >
                          .txt
                        </button>
                      )}
                      {lesson.mediaSize > 0 && (
                        <button
                          type="button"
                          onClick={() => onDownloadMedia(lesson)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white text-black hover:bg-white/90 disabled:opacity-50"
                        >
                          {busy ? "…" : `Скачать .${lesson.mediaExtension ?? "файл"}`}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(lesson.id)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-400/20"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
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
      ))}
    </div>
  );
};
