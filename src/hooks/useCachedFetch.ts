import { useEffect, useState } from "react";
import { useUser } from "../context/userContext";

export interface CachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  updateCache: (newData: T) => void;
}

/**
 * Cached GET + localStorage. Cache read/write and network fetch run only when
 * the user is logged in and, if `resourceUserId` is passed, it matches `user.id`.
 */
function useCachedFetch<T>(
  url: string,
  resourceUserId?: number,
): CachedFetchResult<T> {
  const { user } = useUser();
  const key = `cache:${url}`;

  const isAuthorized =
    user != null &&
    (resourceUserId === undefined || user.id === resourceUserId);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- sync from auth + localStorage + network */
  useEffect(() => {
    let cancelled = false;

    if (!isAuthorized) {
      setData(null);
      setLoading(false);
      setError("You are not authorized to access this data.");
      return () => {
        cancelled = true;
      };
    }

    setError(null);

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
      // bad cache — fetch fresh
    }

    if (!cancelled) {
      setLoading(true);
    }

    const fetchData = async () => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const fresh = (await response.json()) as T;

        localStorage.setItem(key, JSON.stringify(fresh));

        if (!cancelled) {
          setData(fresh);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong",
          );
        }
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
  }, [url, key, isAuthorized]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function updateCache(newData: T) {
    if (!isAuthorized) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch {
      console.error("Cache update failed");
    }
  }

  return { data, loading, error, updateCache };
}

export default useCachedFetch;
