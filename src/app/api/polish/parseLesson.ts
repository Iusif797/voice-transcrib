import type { PolishedLesson } from "@/features/ai/types";

export const parseLessonJson = (raw: string): PolishedLesson => {
  const trimmed = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const tryParse = (text: string): PolishedLesson | null => {
    try {
      const parsed = JSON.parse(text) as Partial<PolishedLesson>;
      if (typeof parsed.summary === "string" && typeof parsed.full === "string" && parsed.summary && parsed.full) {
        return {
          title: typeof parsed.title === "string" ? parsed.title : "",
          summary: parsed.summary,
          full: parsed.full,
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const nested = tryParse(trimmed.slice(start, end + 1));
    if (nested) return nested;
  }

  throw new Error("Некорректный ответ модели");
};
