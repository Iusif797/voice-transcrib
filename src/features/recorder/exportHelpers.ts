export const summaryFallback = (text: string): string => {
  const t = text.trim();
  if (t.length <= 1800) return t;
  return `${t.slice(0, 1800)}\n\n…`;
};

export const extensionForMime = (mime: string): string => {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("m4a")) return "m4a";
  return "audio";
};
