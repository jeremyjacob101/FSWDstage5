import { useEffect, useRef } from "react";

const SCROLL_SAVE_INTERVAL_MS = 120;
let didRestoreScrollForCurrentDocument = false;

function readScrollY(key: string) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const value = Number(stored);
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function writeScrollY(key: string) {
  try {
    localStorage.setItem(key, String(window.scrollY));
  } catch {
    // storage might be unavailable or full; ignore
  }
}

export function usePersistentScroll(key: string, enabled = true, ready = true) {
  const restoredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    if (didRestoreScrollForCurrentDocument) {
      if (restoredKeyRef.current !== key) {
        const frameId = window.requestAnimationFrame(() => {
          window.scrollTo(0, 0);
        });
        restoredKeyRef.current = key;
        return () => {
          window.cancelAnimationFrame(frameId);
        };
      }
      restoredKeyRef.current = key;
      return;
    }

    if (restoredKeyRef.current === key) {
      return;
    }

    const scrollY = readScrollY(key);
    if (scrollY == null) {
      didRestoreScrollForCurrentDocument = true;
      restoredKeyRef.current = key;
      return;
    }

    let firstFrame = 0;
    let secondFrame = 0;

    // Double RAF helps restore after async layout + hydrated content paint.
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    });
    didRestoreScrollForCurrentDocument = true;
    restoredKeyRef.current = key;

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [enabled, key, ready]);

  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    let lastSavedAt = 0;
    let frameId = 0;

    const onScroll = () => {
      const now = performance.now();
      if (now - lastSavedAt >= SCROLL_SAVE_INTERVAL_MS) {
        lastSavedAt = now;
        writeScrollY(key);
        return;
      }

      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        lastSavedAt = performance.now();
        writeScrollY(key);
      });
    };

    const onBeforeUnload = () => {
      writeScrollY(key);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      writeScrollY(key);
    };
  }, [enabled, key, ready]);
}
