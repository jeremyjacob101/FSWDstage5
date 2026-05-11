import type { Dispatch, SetStateAction } from "react";
import useCachedFetch from "./useCachedFetch";
import { useUser } from "../context/user";
import { API_BASE_URL } from "../api/api";

export function useCachedUserResources<T>(
  resource: "todos" | "posts" | "albums",
  scopedToCurrentUser = true,
) {
  const { user } = useUser();
  const userId = user?.id;
  const query = scopedToCurrentUser ? `?userId=${userId ?? 0}` : "";
  const { data, loading, updateCache } = useCachedFetch<T[]>(
    `${API_BASE_URL}/${resource}${query}`,
  );
  const setItems: Dispatch<SetStateAction<T[]>> = (action) => {
    updateCache(typeof action === "function" ? action(data ?? []) : action);
  };

  return {
    items: data ?? [],
    setItems,
    isLoading: loading,
  };
}
