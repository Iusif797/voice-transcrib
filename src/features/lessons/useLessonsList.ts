"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteLesson, listLessons } from "./lessonStore";
import type { LessonSummary } from "./types";

export const useLessonsList = () => {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      return listLessons()
        .then((next) => {
          if (!cancelled) setLessons(next);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Не удалось загрузить уроки");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteLesson(id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { lessons, loading, error, refresh, remove };
};
