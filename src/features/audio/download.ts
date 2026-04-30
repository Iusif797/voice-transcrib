export const downloadBlob = (blob: Blob, filename: string): void => {
  if (!blob || blob.size === 0) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Large files (e.g. 1GB+ video) can take a long time to flush to disk.
  // Revoking too early aborts the download — give it 5 minutes.
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
};

export const safeFileName = (name: string): string =>
  name.replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "recording";
