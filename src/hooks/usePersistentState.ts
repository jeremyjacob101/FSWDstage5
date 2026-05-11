import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

function readState<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(
  key: string,
  initialState: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [activeKey, setActiveKey] = useState(key);
  const [state, setState] = useState<T>(() => readState(key, initialState));

  useEffect(() => {
    if (activeKey === key) {
      return;
    }
    setActiveKey(key);
    setState(readState(key, initialState));
  }, [activeKey, initialState, key]);

  useEffect(() => {
    if (activeKey !== key) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage might be unavailable or full; keep app state in memory
    }
  }, [activeKey, key, state]);

  return [state, setState];
}
