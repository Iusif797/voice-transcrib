import type { jsPDF as JsPDFType } from "jspdf";

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

export const createPdfDoc = async (): Promise<JsPDFType> => {
  const [{ jsPDF }, fontBase64] = await Promise.all([import("jspdf"), loadFont()]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");
  return doc;
};
