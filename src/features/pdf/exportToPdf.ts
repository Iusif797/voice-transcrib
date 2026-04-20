import type { TranscriptSegment } from "@/features/recorder/types";
import { formatDuration } from "@/features/recorder/format";

interface ExportParams {
  title: string;
  segments: TranscriptSegment[];
  durationMs: number;
  createdAt: Date;
}

let fontCache: string | null = null;

const loadFont = async (): Promise<string> => {
  if (fontCache) return fontCache;
  const response = await fetch("/fonts/Roboto-Regular.ttf");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  fontCache = btoa(binary);
  return fontCache;
};

export const exportToPdf = async ({ title, segments, durationMs, createdAt }: ExportParams) => {
  const [{ jsPDF }, fontBase64] = await Promise.all([import("jspdf"), loadFont()]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(22);
  doc.text(title, margin, margin + 10);

  doc.setFontSize(11);
  doc.setTextColor(110, 110, 120);
  const meta = `${createdAt.toLocaleString("ru-RU")} · Длительность ${formatDuration(durationMs)}`;
  doc.text(meta, margin, margin + 34);

  doc.setDrawColor(220);
  doc.line(margin, margin + 48, pageWidth - margin, margin + 48);

  doc.setTextColor(30, 30, 35);
  doc.setFontSize(12);

  const body = segments.map((segment) => segment.text).join("\n\n") || "Транскрипт пуст.";
  const lines = doc.splitTextToSize(body, contentWidth) as string[];

  const lineHeight = 18;
  let cursorY = margin + 80;

  lines.forEach((line) => {
    if (cursorY + lineHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  const fileName = `${title.replace(/[^\p{L}\p{N}_-]+/gu, "_")}.pdf`;
  doc.save(fileName);
};
