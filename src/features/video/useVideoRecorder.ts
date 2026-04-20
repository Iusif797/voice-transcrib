"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickVideoFormat } from "./mime";

interface VideoState {
  stream: MediaStream | null;
  blob: Blob | null;
  url: string | null;
  extension: "mp4" | "webm" | null;
  error: string | null;
}

const INITIAL: VideoState = { stream: null, blob: null, url: null, extension: null, error: null };

export const useVideoRecorder = () => {
  const [state, setState] = useState<VideoState>(INITIAL);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopTracks = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(
    () => () => {
      stopTracks(recorderRef.current?.stream ?? null);
      if (state.url) URL.revokeObjectURL(state.url);
    },
    [state.url, stopTracks],
  );

  const start = useCallback(async () => {
    const format = pickVideoFormat();
    if (!format) {
      setState({ ...INITIAL, error: "Видео-запись не поддерживается браузером" });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      const recorder = new MediaRecorder(stream, { mimeType: format.mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: format.mimeType });
        stopTracks(stream);
        setState({
          stream: null,
          blob,
          url: URL.createObjectURL(blob),
          extension: format.extension,
          error: null,
        });
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setState({ stream, blob: null, url: null, extension: format.extension, error: null });
      return true;
    } catch {
      setState({ ...INITIAL, error: "Нет доступа к камере или микрофону" });
      return false;
    }
  }, [stopTracks]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (state.url) URL.revokeObjectURL(state.url);
    setState(INITIAL);
  }, [state.url]);

  return { ...state, start, stop, reset };
};
