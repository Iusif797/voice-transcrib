import { downloadBlob, safeFileName } from "@/features/audio/download";
import { formatDuration } from "@/features/recorder/format";
import { parseMarkdown } from "./markdown";
import { createPdfDoc } from "./pdfDoc";
import { renderBlocks } from "./renderBlocks";

interface Params {
  title: string;
  body: string;
  durationMs: number;
  createdAt: Date;
  variant: "full" | "summary";
}

export const exportLessonPdf = async ({ title, body, durationMs, createdAt, variant }: Params): Promise<void> => {
  const doc = await createPdfDoc();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const layout = { margin, width: pageWidth - margin * 2, pageHeight };

  doc.setTextColor(14, 14, 20);
  doc.setFontSize(22);
  doc.text(title || "Урок", margin, margin + 14);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 130);
  const label = variant === "summary" ? "Краткая версия" : "Полная версия";
  doc.text(`${label} · ${createdAt.toLocaleString("ru-RU")} · ${formatDuration(durationMs)}`, margin, margin + 34);

  doc.setDrawColor(225);
  doc.line(margin, margin + 46, pageWidth - margin, margin + 46);

  const blocks = parseMarkdown(body || "Пусто.");
  const cursor = { y: margin + 70 };
  renderBlocks(doc, blocks, layout, cursor);

  const suffix = variant === "summary" ? "кратко" : "полный";
  const name = `${safeFileName(title)}_${suffix}.pdf`;
  const blob = doc.output("blob");
  downloadBlob(blob, name);
};
