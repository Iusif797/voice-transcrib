"use client";

import type { RecorderStatus } from "./types";

interface Props {
  status: RecorderStatus;
  onStart: () => void;
  onStop: () => void;
}

export const RecordButton = ({ status, onStart, onStop }: Props) => {
  const recording = status === "recording";
  const disabled = status === "unsupported";

  return (
    <button
      type="button"
      onClick={recording ? onStop : onStart}
      disabled={disabled}
      aria-label={recording ? "Остановить запись" : "Начать запись"}
      className="relative group disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span
        className={`relative flex items-center justify-center h-24 w-24 rounded-full transition-all duration-300 shadow-[0_20px_60px_-20px_rgba(168,85,247,0.6)] ${
          recording
            ? "bg-gradient-to-br from-red-500 to-rose-600 record-ring"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 group-hover:scale-105"
        }`}
      >
        {recording ? (
          <span className="h-6 w-6 rounded-md bg-white" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.08A7 7 0 0 0 19 11Z" />
          </svg>
        )}
      </span>
    </button>
  );
};
