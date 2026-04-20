"use client";

import { useEffect, useRef, useState } from "react";

export const useTimer = (active: boolean) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!active) {
      if (startRef.current !== null) {
        baseRef.current += performance.now() - startRef.current;
        startRef.current = null;
      }
      return;
    }
    startRef.current = performance.now();
    const id = window.setInterval(() => {
      if (startRef.current === null) return;
      setElapsedMs(baseRef.current + (performance.now() - startRef.current));
    }, 200);
    return () => window.clearInterval(id);
  }, [active]);

  const reset = () => {
    baseRef.current = 0;
    startRef.current = null;
    setElapsedMs(0);
  };

  return { elapsedMs, reset };
};
