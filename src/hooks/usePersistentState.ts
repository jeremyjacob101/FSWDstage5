import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function usePersistentState<T>(
  key: string,
  initialState: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [activeKey, setActiveKey] = useState(key);
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialState;
  });

  useEffect(() => {
    if (activeKey === key) {
      return;
    }
    setActiveKey(key);
    const stored = localStorage.getItem(key);
    setState(stored ? (JSON.parse(stored) as T) : initialState);
  }, [activeKey, initialState, key]);

  useEffect(() => {
    if (activeKey !== key) {
      return;
    }
    localStorage.setItem(key, JSON.stringify(state));
  }, [activeKey, key, state]);

  return [state, setState];
}
