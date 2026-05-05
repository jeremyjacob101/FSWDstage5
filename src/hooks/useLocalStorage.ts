// src/hooks/useLocalStorage.ts
import { useState, useEffect } from "react";

function useLocalStorage<T>(key: string, initialValue: T) {

  //Read from localStorage on first load
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error("useLocalStorage read error:", error);
      return initialValue;
    }
  });

  //Sync to localStorage whenever storedValue changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("useLocalStorage write error:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

export default useLocalStorage;