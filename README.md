# VoiceScribe

Приложение для записи голосовых уроков с автоматической транскрибацией в реальном времени, AI-редактурой текста и экспортом в MP3/PDF.

## Возможности

- Запись с микрофона (`MediaRecorder`)
- Транскрибация в реальном времени через Web Speech API
- AI-редактура расшифровки (грамматика + красивый конспект) через OpenAI
- Две версии PDF: полная и краткая (до 2 страниц A4)
- Экспорт аудио в MP3 через lamejs (клиентская кодировка)
- Премиальный тёмный UI, адаптивный, без аналитики и трекеров

## Технологии

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · jsPDF · @breezystack/lamejs · OpenAI API

## Переменные окружения

Один из ключей обязателен — провайдер выбирается автоматически:

| Переменная | Провайдер | Где получить |
| --- | --- | --- |
| `XAI_API_KEY` | xAI Grok | [console.x.ai](https://console.x.ai) |
| `OPENAI_API_KEY` | OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) |
| `AI_MODEL` *(опц.)* | переопределение модели | `grok-2-latest`, `gpt-4o-mini` и т.п. |
| `AI_PROVIDER` *(опц.)* | форс-выбор | `xai` или `openai` |

## Локальный запуск

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в Chrome или Edge.

## Деплой на Vercel

1. Импортируйте репозиторий на [vercel.com/new](https://vercel.com/new)
2. В Settings → Environment Variables добавьте `OPENAI_API_KEY`
3. Нажмите Deploy

## Совместимость с устройствами

| Платформа | Запись | Транскрибация | MP3 | PDF |
| --- | --- | --- | --- | --- |
| Desktop Chrome / Edge | ✓ | ✓ | ✓ | ✓ |
| Android Chrome | ✓ | ✓ | ✓ | ✓ |
| iOS Safari / Chrome | ✓ | — | ✓ | ✓ |

На iOS Web Speech API не реализован Apple. Запись и экспорт работают, транскрибации не будет.
