import type { LessonSummary } from "./types";

export interface LessonGroup {
  key: string;
  label: string;
  lessons: LessonSummary[];
}

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDayLabel = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const groupLessonsByDay = (lessons: LessonSummary[]): LessonGroup[] => {
  const groups = new Map<string, LessonGroup>();
  for (const lesson of lessons) {
    const date = new Date(lesson.createdAt);
    const key = dayKey(date);
    const existing = groups.get(key);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      groups.set(key, {
        key,
        label: formatDayLabel(lesson.createdAt),
        lessons: [lesson],
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
};

export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return "0 КБ";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} ГБ`;
};
