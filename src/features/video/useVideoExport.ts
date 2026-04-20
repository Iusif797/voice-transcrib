"use client";

import { useCallback } from "react";
import { downloadBlob, safeFileName } from "@/features/audio/download";

interface Params {
  title: string;
  blob: Blob | null;
  extension: "mp4" | "webm" | null;
}

export const useVideoExport = ({ title, blob, extension }: Params) => {
  const downloadVideo = useCallback(() => {
    if (!blob || !extension) return;
    downloadBlob(blob, `${safeFileName(title)}.${extension}`);
  }, [blob, extension, title]);

  return { downloadVideo };
};
