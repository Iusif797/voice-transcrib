"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickVideoFormat } from "./mime";

interface VideoState {
  stream: MediaStream | null;
  blob: Blob | null;
  url: string | null;
  extension: "mp4" | "webm" | null;
  error: string | null;
  finalizing: boolean;
}

const INITIAL: VideoState = {
  stream: null,
  blob: null,
  url: null,
  extension: null,
  error: null,
  finalizing: false,
};

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
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = chunksRef.current;
        const blob = new Blob(chunks, { type: format.mimeType });
        chunksRef.current = [];
        stopTracks(stream);
        if (blob.size === 0) {
          setState({
            ...INITIAL,
            extension: format.extension,
            error: "Запись пуста — попробуйте ещё раз",
          });
          return;
        }
        setState({
          stream: null,
          blob,
          url: URL.createObjectURL(blob),
          extension: format.extension,
          error: null,
          finalizing: false,
        });
      };
      recorder.onerror = () => {
        setState((prev) => ({ ...prev, error: "Сбой записи видео", finalizing: false }));
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setState({
        stream,
        blob: null,
        url: null,
        extension: format.extension,
        error: null,
        finalizing: false,
      });
      return true;
    } catch {
      setState({ ...INITIAL, error: "Нет доступа к камере или микрофону" });
      return false;
    }
  }, [stopTracks]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      recorderRef.current = null;
      return;
    }
    setState((prev) => ({ ...prev, finalizing: true }));
    try {
      recorder.requestData();
    } catch {
      /* not all browsers support requestData on every state */
    }
    recorder.stop();
    recorderRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (state.url) URL.revokeObjectURL(state.url);
    chunksRef.current = [];
    setState(INITIAL);
  }, [state.url]);

  return { ...state, start, stop, reset };
};
