const ERROR_MESSAGES: Record<string, string> = {
  network:
    "Нет связи с сервисом распознавания Google. Проверьте интернет — Chrome отправляет аудио в облако для транскрибации.",
  "not-allowed": "Доступ к микрофону запрещён в настройках браузера.",
  "service-not-allowed":
    "Браузер заблокировал распознавание. Откройте страницу по https или на localhost.",
  "audio-capture": "Микрофон не найден. Подключите устройство ввода.",
  "language-not-supported": "Выбранный язык не поддерживается этим браузером.",
};

export const readableError = (code: string): string =>
  ERROR_MESSAGES[code] ?? `Ошибка распознавания (${code}).`;
