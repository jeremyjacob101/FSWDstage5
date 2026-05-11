import { useEffect, useState } from "react";
import { useUser } from "../context/user";

export default function useCachedFetch<T>(url: string) {
  const { user } = useUser();
  const currentUserId = user?.id;
  const key = `cache:${url}`;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = localStorage.getItem(key);
    if (cached) {
      setData(JSON.parse(cached) as T);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": String(currentUserId),
      },
    })
      .then((response) => response.json() as Promise<T>)
      .then((fresh) => {
        if (!active) return;
        localStorage.setItem(key, JSON.stringify(fresh));
        setData(fresh);
      })
      .catch(() => {
        return;
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [url, key, currentUserId]);

  function updateCache(newData: T) {
    if (!currentUserId) {
      return;
    }
    localStorage.setItem(key, JSON.stringify(newData));
    setData(newData);
  }

  return { data, loading, updateCache };
}
