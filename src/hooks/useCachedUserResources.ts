import type { Dispatch, SetStateAction } from "react";
import { API_BASE_URL } from "../api/helpers";
import { useUser } from "../context/userContext";
import type { Album, Post, Todo } from "../data/types";
import useCachedFetch from "./useCachedFetch";

function resourceUrl(pathWithQuery: string) {
  return `${API_BASE_URL}${pathWithQuery}`;
}

/** Cached todos for the logged-in user (JSON-Server). */
export function useCachedUserTodos() {
  const { user } = useUser();
  const userId = user?.id;
  const url = resourceUrl(`/todos?userId=${userId ?? 0}`);
  const { data, loading, error, updateCache } = useCachedFetch<Todo[]>(
    url,
    userId,
  );

  const todos = data ?? [];
  const setTodos: Dispatch<SetStateAction<Todo[]>> = (action) => {
    updateCache(typeof action === "function" ? action(data ?? []) : action);
  };

  return { todos, setTodos, isLoading: loading, loadError: error };
}

/** Cached posts for the logged-in user. */
export function useCachedUserPosts() {
  const { user } = useUser();
  const userId = user?.id;
  const url = resourceUrl(`/posts?userId=${userId ?? 0}`);
  const { data, loading, error, updateCache } = useCachedFetch<Post[]>(
    url,
    userId,
  );

  const posts = data ?? [];
  const setPosts: Dispatch<SetStateAction<Post[]>> = (action) => {
    updateCache(typeof action === "function" ? action(data ?? []) : action);
  };

  return { posts, setPosts, isLoading: loading, loadError: error };
}

/** Cached albums for the logged-in user. */
export function useCachedUserAlbums() {
  const { user } = useUser();
  const userId = user?.id;
  const url = resourceUrl(`/albums?userId=${userId ?? 0}`);
  const { data, loading, error, updateCache } = useCachedFetch<Album[]>(
    url,
    userId,
  );

  const albums = data ?? [];
  const setAlbums: Dispatch<SetStateAction<Album[]>> = (action) => {
    updateCache(typeof action === "function" ? action(data ?? []) : action);
  };

  return { albums, setAlbums, isLoading: loading, loadError: error };
}
