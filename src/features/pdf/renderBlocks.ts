import type { jsPDF as JsPDFType } from "jspdf";
import type { Block } from "./markdown";
import { stripBold } from "./markdown";

interface Layout {
  margin: number;
  width: number;
  pageHeight: number;
}

interface Cursor {
  y: number;
}

const STYLES: Record<Block["type"], { size: number; gap: number; indent: number }> = {
  h1: { size: 20, gap: 14, indent: 0 },
  h2: { size: 15, gap: 10, indent: 0 },
  h3: { size: 13, gap: 8, indent: 0 },
  p: { size: 11, gap: 6, indent: 0 },
  bullet: { size: 11, gap: 4, indent: 14 },
  space: { size: 11, gap: 8, indent: 0 },
};

const ensureSpace = (doc: JsPDFType, cursor: Cursor, layout: Layout, need: number) => {
  if (cursor.y + need > layout.pageHeight - layout.margin) {
    doc.addPage();
    cursor.y = layout.margin;
  }
};

export const renderBlocks = (doc: JsPDFType, blocks: Block[], layout: Layout, cursor: Cursor): void => {
  blocks.forEach((block) => {
    const style = STYLES[block.type];
    if (block.type === "space") {
      cursor.y += style.gap;
      return;
    }
    doc.setFontSize(style.size);
    const isHeading = block.type === "h1" || block.type === "h2" || block.type === "h3";
    doc.setTextColor(isHeading ? 18 : 40, isHeading ? 18 : 40, isHeading ? 22 : 48);

    const prefix = block.type === "bullet" ? "•  " : "";
    const text = prefix + stripBold(block.text);
    const lines = doc.splitTextToSize(text, layout.width - style.indent) as string[];
    const lineHeight = style.size * 1.35;

    lines.forEach((line) => {
      ensureSpace(doc, cursor, layout, lineHeight);
      doc.text(line, layout.margin + style.indent, cursor.y + style.size);
      cursor.y += lineHeight;
    });
    cursor.y += style.gap;
  });
};
