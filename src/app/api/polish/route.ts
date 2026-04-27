import { NextResponse } from "next/server";
import type { PolishedLesson } from "@/features/ai/types";
import { sendCompletion } from "./completion";
import { parseLessonJson } from "./parseLesson";
import { getProvider } from "./provider";

export const runtime = "edge";

interface RequestBody {
  title: string;
  transcript: string;
}

const SYSTEM_PROMPT = `Ты — редактор образовательных материалов. Тебе приходит расшифровка голосовой лекции.
Исправь грамматику, пунктуацию и оформи текст как аккуратный конспект.
Сохрани смысл и терминологию. Раздели на логические абзацы, используй подзаголовки и маркированные списки там, где это уместно.
Верни СТРОГО JSON без обёрток markdown следующей формы:
{
  "title": "Улучшенное короткое название урока",
  "summary": "Конспект на 2 страницы A4 (до 1800 символов). Ключевые идеи, тезисы, выводы. Markdown: заголовки ## и списки.",
  "full": "Полный отредактированный конспект. Markdown: заголовки ##, подзаголовки ###, списки, выделения жирным там, где уместно."
}`;

export async function POST(request: Request) {
  const provider = getProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "AI-ключ не настроен. Добавьте XAI_API_KEY или OPENAI_API_KEY в переменные окружения." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as RequestBody;
  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: "Пустой транскрипт" }, { status: 400 });
  }

  const userContent = `Название: ${body.title || "Урок"}\n\nРасшифровка:\n${body.transcript}`;
  let response = await sendCompletion(provider, SYSTEM_PROMPT, userContent, true);
  if (!response.ok) {
    const second = await sendCompletion(provider, SYSTEM_PROMPT, userContent, false);
    if (second.ok) response = second;
  }

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text.slice(0, 800) }, { status: response.status });
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "Пустой ответ модели" }, { status: 502 });
  }

  try {
    const lesson: PolishedLesson = parseLessonJson(raw);
    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "Не удалось разобрать JSON от модели" }, { status: 502 });
  }
}
