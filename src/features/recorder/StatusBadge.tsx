import type { RecorderStatus } from "./types";

const LABELS: Record<RecorderStatus, { text: string; tone: string }> = {
  idle: { text: "Готово", tone: "bg-white/10 text-white/70" },
  recording: { text: "Запись", tone: "bg-red-500/15 text-red-300" },
  paused: { text: "Пауза", tone: "bg-amber-400/15 text-amber-300" },
  unsupported: { text: "Браузер не поддерживается", tone: "bg-amber-400/15 text-amber-300" },
};

export const StatusBadge = ({ status }: { status: RecorderStatus }) => {
  const { text, tone } = LABELS[status];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "recording" ? "bg-red-400 animate-pulse" : "bg-current/60"}`} />
      {text}
    </span>
  );
};
