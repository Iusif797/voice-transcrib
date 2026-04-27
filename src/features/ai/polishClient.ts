import type { PolishedLesson } from "./types";

const readError = async (response: Response): Promise<string> => {
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  const raw = payload?.error ?? response.statusText ?? "Ошибка обработки";
  return typeof raw === "string" ? raw.slice(0, 600) : "Ошибка обработки";
};

export const polishLesson = async (title: string, transcript: string): Promise<PolishedLesson> => {
  const response = await fetch("/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, transcript }),
  });

  if (!response.ok) throw new Error(await readError(response));

  const data = (await response.json().catch(() => null)) as PolishedLesson | null;
  if (!data || typeof data.full !== "string" || typeof data.summary !== "string") {
    throw new Error("Некорректный ответ сервера");
  }
  return data;
};
