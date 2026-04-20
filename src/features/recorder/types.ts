export type RecorderStatus = "idle" | "recording" | "paused" | "unsupported";

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
}

export interface RecorderState {
  status: RecorderStatus;
  elapsedMs: number;
  segments: TranscriptSegment[];
  interim: string;
  audioUrl: string | null;
  error: string | null;
}
