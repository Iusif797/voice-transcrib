import { NextResponse } from "next/server";
import type { PolishedLesson } from "@/features/ai/types";

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

const extractJson = (raw: string): PolishedLesson => {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as PolishedLesson;
  if (!parsed.summary || !parsed.full) throw new Error("Некорректный ответ модели");
  return parsed;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен на сервере" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as RequestBody;
  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: "Пустой транскрипт" }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Название: ${body.title || "Урок"}\n\nРасшифровка:\n${body.transcript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text.slice(0, 500) }, { status: response.status });
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const lesson = extractJson(data.choices[0]?.message?.content ?? "");
  return NextResponse.json(lesson);
}
