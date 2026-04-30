"use client";

import { getSupabase, SUPABASE_BUCKET } from "@/lib/supabase";
import type {
  LessonAttachment,
  LessonRecord,
  LessonSegment,
  LessonSummary,
} from "./types";

const TABLE = "lessons";

interface DbRow {
  id: string;
  title: string;
  kind: "audio" | "video";
  created_at: string;
  duration_ms: number;
  transcript: string;
  segments: LessonSegment[] | null;
  media_path: string | null;
  media_mime: string | null;
  media_extension: string | null;
  media_size: number | null;
  pdf_full_path: string | null;
  pdf_full_size: number | null;
  pdf_summary_path: string | null;
  pdf_summary_size: number | null;
}

const publicUrl = (path: string | null): string | null => {
  if (!path) return null;
  return getSupabase().storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
};

const buildAttachment = (
  path: string | null,
  size: number | null,
  extension: string | null,
  mime: string | null,
): LessonAttachment | null => {
  if (!path) return null;
  const url = publicUrl(path);
  if (!url) return null;
  return {
    path,
    url,
    size: Number(size ?? 0),
    extension,
    mime,
  };
};

const toRecord = (row: DbRow): LessonRecord => ({
  id: row.id,
  title: row.title,
  kind: row.kind,
  createdAt: new Date(row.created_at).getTime(),
  durationMs: row.duration_ms,
  transcript: row.transcript ?? "",
  segments: row.segments ?? [],
  media: buildAttachment(row.media_path, row.media_size, row.media_extension, row.media_mime),
  pdfFull: buildAttachment(row.pdf_full_path, row.pdf_full_size, "pdf", "application/pdf"),
  pdfSummary: buildAttachment(row.pdf_summary_path, row.pdf_summary_size, "pdf", "application/pdf"),
});

const toSummary = (record: LessonRecord): LessonSummary => ({
  id: record.id,
  title: record.title,
  kind: record.kind,
  createdAt: record.createdAt,
  durationMs: record.durationMs,
  transcriptLength: record.transcript.length,
  media: record.media,
  pdfFull: record.pdfFull,
  pdfSummary: record.pdfSummary,
});

export type SavePhase = "uploading-media" | "uploading-pdf" | "saving";

export interface SaveLessonInput {
  title: string;
  kind: "audio" | "video";
  durationMs: number;
  transcript: string;
  segments: LessonSegment[];
  mediaBlob: Blob | null;
  mediaExtension: string | null;
  pdfFullBlob: Blob | null;
  pdfSummaryBlob: Blob | null;
  onProgress?: (phase: SavePhase) => void;
}

const dayFolder = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const generateLessonId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const safeExt = (ext: string | null, fallback: string): string => {
  if (!ext) return fallback;
  const cleaned = ext.replace(/[^a-z0-9]/gi, "");
  return cleaned.length > 0 ? cleaned.toLowerCase() : fallback;
};

const uploadFile = async (path: string, blob: Blob, contentType: string): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, blob, { contentType, upsert: false, cacheControl: "3600" });
  if (error) throw new Error(error.message);
};

export const saveLesson = async (input: SaveLessonInput): Promise<string> => {
  const supabase = getSupabase();
  const lessonId = generateLessonId();
  const day = dayFolder(new Date());
  const folder = `${day}/${lessonId}`;

  const uploaded: string[] = [];
  let mediaPath: string | null = null;
  let mediaMime: string | null = null;
  let mediaSize = 0;
  let pdfFullPath: string | null = null;
  let pdfFullSize = 0;
  let pdfSummaryPath: string | null = null;
  let pdfSummarySize = 0;

  try {
    if (input.mediaBlob && input.mediaBlob.size > 0) {
      input.onProgress?.("uploading-media");
      const ext = safeExt(input.mediaExtension, input.kind === "video" ? "webm" : "webm");
      const path = `${folder}/${input.kind}.${ext}`;
      const contentType = input.mediaBlob.type || "application/octet-stream";
      await uploadFile(path, input.mediaBlob, contentType);
      uploaded.push(path);
      mediaPath = path;
      mediaMime = contentType;
      mediaSize = input.mediaBlob.size;
    }

    if (input.pdfFullBlob && input.pdfFullBlob.size > 0) {
      input.onProgress?.("uploading-pdf");
      const path = `${folder}/full.pdf`;
      await uploadFile(path, input.pdfFullBlob, "application/pdf");
      uploaded.push(path);
      pdfFullPath = path;
      pdfFullSize = input.pdfFullBlob.size;
    }

    if (input.pdfSummaryBlob && input.pdfSummaryBlob.size > 0) {
      input.onProgress?.("uploading-pdf");
      const path = `${folder}/summary.pdf`;
      await uploadFile(path, input.pdfSummaryBlob, "application/pdf");
      uploaded.push(path);
      pdfSummaryPath = path;
      pdfSummarySize = input.pdfSummaryBlob.size;
    }

    input.onProgress?.("saving");
    const { error } = await supabase.from(TABLE).insert({
      id: lessonId,
      title: input.title.trim() || "Без названия",
      kind: input.kind,
      duration_ms: input.durationMs,
      transcript: input.transcript,
      segments: input.segments,
      media_path: mediaPath,
      media_mime: mediaMime,
      media_extension: input.mediaExtension,
      media_size: mediaSize,
      pdf_full_path: pdfFullPath,
      pdf_full_size: pdfFullSize,
      pdf_summary_path: pdfSummaryPath,
      pdf_summary_size: pdfSummarySize,
    });
    if (error) throw new Error(error.message);
    return lessonId;
  } catch (err) {
    if (uploaded.length > 0) {
      await supabase.storage.from(SUPABASE_BUCKET).remove(uploaded).catch(() => undefined);
    }
    const message = err instanceof Error ? err.message : "Не удалось сохранить урок";
    throw new Error(message);
  }
};

export const listLessons = async (): Promise<LessonSummary[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbRow[]).map((row) => toSummary(toRecord(row)));
};

export const getLesson = async (id: string): Promise<LessonRecord | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as DbRow) : null;
};

const collectPaths = (record: DbRow | null): string[] => {
  if (!record) return [];
  return [record.media_path, record.pdf_full_path, record.pdf_summary_path].filter(
    (p): p is string => Boolean(p),
  );
};

export const deleteLesson = async (id: string): Promise<void> => {
  const supabase = getSupabase();
  const { data: row } = await supabase
    .from(TABLE)
    .select("media_path, pdf_full_path, pdf_summary_path")
    .eq("id", id)
    .maybeSingle();
  const paths = collectPaths(row as DbRow | null);
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (paths.length > 0) {
    await supabase.storage.from(SUPABASE_BUCKET).remove(paths).catch(() => undefined);
  }
};

export const fetchAttachmentBlob = async (path: string): Promise<Blob> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "Файл не найден");
  return data;
};
