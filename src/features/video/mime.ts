interface VideoFormat {
  mimeType: string;
  extension: "mp4" | "webm";
}

const CANDIDATES: VideoFormat[] = [
  { mimeType: "video/mp4;codecs=h264,aac", extension: "mp4" },
  { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4" },
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
  { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

export const pickVideoFormat = (): VideoFormat | null => {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((format) => MediaRecorder.isTypeSupported(format.mimeType)) ?? null;
};
