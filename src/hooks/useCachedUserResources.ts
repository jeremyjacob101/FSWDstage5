import type { Dispatch, SetStateAction } from "react";
import { API_BASE_URL } from "../api/helpers";
import { useUser } from "../context/useUser";
import type { Album, Post, Todo } from "../data/types";
import useCachedFetch from "./useCachedFetch";

function resourceUrl(pathWithQuery: string) {
  return `${API_BASE_URL}${pathWithQuery}`;
}

function createCacheSetter<T>(
  data: T[] | null,
  updateCache: (nextData: T[]) => void,
): Dispatch<SetStateAction<T[]>> {
  return (action) => {
    updateCache(typeof action === "function" ? action(data ?? []) : action);
  };
}

export function useCachedUserTodos() {
  const { user } = useUser();
  const userId = user?.id;
  const url = resourceUrl(`/todos?userId=${userId ?? 0}`);
  const { data, loading, updateCache } = useCachedFetch<Todo[]>(url);

  const todos = data ?? [];
  const setTodos = createCacheSetter(data, updateCache);

  return { todos, setTodos, isLoading: loading };
}

export function useCachedUserPosts() {
  const url = resourceUrl("/posts");
  const { data, loading, updateCache } = useCachedFetch<Post[]>(url);

  const posts = data ?? [];
  const setPosts = createCacheSetter(data, updateCache);

  return { posts, setPosts, isLoading: loading };
}

export function useCachedUserAlbums() {
  const { user } = useUser();
  const userId = user?.id;
  const url = resourceUrl(`/albums?userId=${userId ?? 0}`);
  const { data, loading, updateCache } = useCachedFetch<Album[]>(url);

  const albums = data ?? [];
  const setAlbums = createCacheSetter(data, updateCache);

  return { albums, setAlbums, isLoading: loading };
}
