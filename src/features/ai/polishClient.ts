import type { PolishedLesson } from "./types";

export const polishLesson = async (
  title: string,
  transcript: string,
): Promise<PolishedLesson> => {
  const response = await fetch("/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, transcript }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Ошибка обработки" }));
    throw new Error(payload.error ?? "Ошибка обработки");
  }

  return (await response.json()) as PolishedLesson;
};
