import { useEffect, useRef } from "react";

export function usePersistentScroll(key: string, enabled = true, ready = true) {
  const restoredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    if (restoredKeyRef.current === key) {
      return;
    }

    restoredKeyRef.current = key;
    const stored = localStorage.getItem(key);
    const value = stored == null ? NaN : Number(stored);
    const targetY = Number.isFinite(value) && value >= 0 ? value : 0;

    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo(0, targetY);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [enabled, key, ready]);

  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    let frameId = 0;

    const onScroll = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        localStorage.setItem(key, String(window.scrollY));
      });
    };

    const onBeforeUnload = () => {
      localStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      localStorage.setItem(key, String(window.scrollY));
    };
  }, [enabled, key, ready]);
}
