import { useEffect, useState } from "react";
import { useUser } from "../context/useUser";

export interface CachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  updateCache: (newData: T) => void;
}

function useCachedFetch<T>(url: string): CachedFetchResult<T> {
  const { user } = useUser();
  const currentUserId = user?.id;
  const key = `cache:${url}`;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!currentUserId) {
      setData(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as T;
        if (!cancelled) {
          setData(parsed);
          setLoading(false);
        }
        return () => {
          cancelled = true;
        };
      }
    } catch {
      localStorage.removeItem(key);
    }

    if (!cancelled) {
      setLoading(true);
    }

    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(currentUserId),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const fresh = (await response.json()) as T;

        localStorage.setItem(key, JSON.stringify(fresh));

        if (!cancelled) {
          setData(fresh);
        }
      } catch {
        return;
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [url, key, currentUserId]);

  function updateCache(newData: T) {
    if (!currentUserId) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch {
      return;
    }
  }

  return { data, loading, updateCache };
}

export default useCachedFetch;
