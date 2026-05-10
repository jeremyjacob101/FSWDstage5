import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type SanitizeState<T> = (raw: unknown) => T;

function readState<T>(
  key: string,
  fallback: T,
  sanitize?: SanitizeState<T>,
): T {
  if (typeof localStorage === "undefined") {
    return fallback;
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    const parsed = JSON.parse(stored) as unknown;
    return sanitize ? sanitize(parsed) : (parsed as T);
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(
  key: string,
  initialState: T,
  sanitize?: SanitizeState<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [entry, setEntry] = useState<{ key: string; value: T }>(() => ({
    key,
    value: readState(key, initialState, sanitize),
  }));
  const state =
    entry.key === key ? entry.value : readState(key, initialState, sanitize);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage might be unavailable or full; keep app state in memory
    }
  }, [key, state]);

  const setState = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    setEntry((currentEntry) => {
      const currentStateForKey =
        currentEntry.key === key
          ? currentEntry.value
          : readState(key, initialState, sanitize);
      const nextState =
        typeof action === "function"
          ? (action as (previousState: T) => T)(currentStateForKey)
          : action;

      if (currentEntry.key === key && Object.is(nextState, currentStateForKey)) {
        return currentEntry;
      }

      return {
        key,
        value: nextState,
      };
    });
  }, [initialState, key, sanitize]);

  return [state, setState];
}
