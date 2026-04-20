"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readableError } from "./errors";
import { getSpeechRecognition, type SpeechRecognitionLike } from "./speech";
import type { TranscriptSegment } from "./types";

interface Options {
  lang: string;
}

export const useTranscriber = ({ lang }: Options) => {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeRef = useRef(false);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      retryRef.current = 0;
      setError(null);
      let interimText = "";
      const finals: TranscriptSegment[] = [];
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0].transcript;
        if (result.isFinal) {
          finals.push({
            id: `${Date.now()}-${i}`,
            text: chunk.trim(),
            timestamp: Date.now(),
          });
        } else {
          interimText += chunk;
        }
      }
      if (finals.length > 0) {
        setSegments((prev) => [...prev, ...finals.filter((s) => s.text.length > 0)]);
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        activeRef.current = false;
      }
      setError(readableError(event.error));
    };

    recognition.onend = () => {
      if (!activeRef.current) return;
      retryRef.current += 1;
      const delay = Math.min(3000, 400 * retryRef.current);
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(() => {
        if (!activeRef.current) return;
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }, delay);
    };

    recognitionRef.current = recognition;
    return () => {
      activeRef.current = false;
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
      recognition.onend = null;
      recognition.abort();
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    retryRef.current = 0;
    activeRef.current = true;
    try {
      recognition.start();
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    activeRef.current = false;
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    setInterim("");
    recognition?.stop();
  }, []);

  const reset = useCallback(() => {
    setSegments([]);
    setInterim("");
    setError(null);
  }, []);

  return { segments, interim, supported, error, start, stop, reset };
};
