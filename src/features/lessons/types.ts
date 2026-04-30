export type LessonKind = "audio" | "video";

export interface LessonSegment {
  id: string;
  text: string;
  timestamp: number;
}

export interface LessonAttachment {
  path: string;
  url: string;
  size: number;
  extension: string | null;
  mime: string | null;
}

export interface LessonRecord {
  id: string;
  title: string;
  kind: LessonKind;
  createdAt: number;
  durationMs: number;
  transcript: string;
  segments: LessonSegment[];
  media: LessonAttachment | null;
  pdfFull: LessonAttachment | null;
  pdfSummary: LessonAttachment | null;
}

export interface LessonSummary {
  id: string;
  title: string;
  kind: LessonKind;
  createdAt: number;
  durationMs: number;
  transcriptLength: number;
  media: LessonAttachment | null;
  pdfFull: LessonAttachment | null;
  pdfSummary: LessonAttachment | null;
}
