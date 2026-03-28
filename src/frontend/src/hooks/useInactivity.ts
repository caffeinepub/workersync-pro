import { useCallback, useEffect, useRef } from "react";

export function useInactivity(timeout: number, onIdle: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onIdle, timeout);
  }, [timeout, onIdle]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
    ];
    for (const e of events) {
      window.addEventListener(e, reset);
    }
    reset();
    return () => {
      for (const e of events) {
        window.removeEventListener(e, reset);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset]);
}
