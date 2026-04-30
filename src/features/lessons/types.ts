export type LessonKind = "audio" | "video";

export interface LessonRecord {
  id: string;
  title: string;
  kind: LessonKind;
  createdAt: number;
  durationMs: number;
  transcript: string;
  segments: Array<{ id: string; text: string; timestamp: number }>;
  mediaMime: string | null;
  mediaExtension: string | null;
  mediaSize: number;
  mediaBlob: Blob | null;
}

export interface LessonSummary {
  id: string;
  title: string;
  kind: LessonKind;
  createdAt: number;
  durationMs: number;
  transcriptLength: number;
  mediaSize: number;
  mediaExtension: string | null;
}
