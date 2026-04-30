"use client";

import { useCallback, useState } from "react";
import { downloadBlob, safeFileName } from "@/features/audio/download";

interface Params {
  title: string;
  blob: Blob | null;
  extension: "mp4" | "webm" | null;
}

export const useVideoExport = ({ title, blob, extension }: Params) => {
  const [busy, setBusy] = useState(false);

  const downloadVideo = useCallback(() => {
    if (!blob || !extension || blob.size === 0) return;
    setBusy(true);
    try {
      downloadBlob(blob, `${safeFileName(title)}.${extension}`);
    } finally {
      // Anchor click is synchronous; the actual file save runs in browser background.
      window.setTimeout(() => setBusy(false), 800);
    }
  }, [blob, extension, title]);

  return { downloadVideo, busy };
};
