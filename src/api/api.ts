import type { CommentUpdates, NewAlbum, NewComment, NewPhoto, NewPost, NewTodo, NewUserDetails, PhotoUpdates, PostUpdates, TodoUpdates } from "../types/api";
import type { Album, Comment, Photo, Post, Todo, User } from "../types/general";

export const API_BASE_URL = "http://localhost:1837";

// Base request function
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let userId: number | null = null;
  try {
    const loggedIn = localStorage.getItem("entryBaseUser");
    if (loggedIn) {
      userId = (JSON.parse(loggedIn) as { id: number }).id;
    } else {
      const pending = localStorage.getItem("entryBasePendingRegistration");
      if (pending) {
        userId = (JSON.parse(pending) as { id: number }).id;
      }
    }
  } catch {
    userId = null;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(userId != null ? { "X-User-Id": String(userId) } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// API endpoints
export async function findUserByUsername(
  username: string,
): Promise<User | null> {
  const users = await request<User[]>(
    `/users?username=${encodeURIComponent(username)}`,
  );

  return users[0] ?? null;
}

export async function authenticateUser({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<User | null> {
  const user = await findUserByUsername(username);

  if (!user || user.website !== password) {
    return null;
  }

  return user;
}

export function createRegisteredUser({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify({
      username,
      website: password,
      name: username,
      email: "",
      phone: "",
      address: {
        street: "",
        suite: "",
        city: "",
        zipcode: "",
      },
      company: {
        name: "",
        catchPhrase: "",
        bs: "",
      },
    }),
  });
}

export function completeUserDetails(
  userId: number,
  details: NewUserDetails,
): Promise<User> {
  return request<User>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(details),
  });
}

export function getTodosForUser(userId: number): Promise<Todo[]> {
  return request<Todo[]>(`/todos?userId=${userId}`);
}

export async function createTodo(todo: NewTodo): Promise<Todo> {
  return request<Todo>("/todos", {
    method: "POST",
    body: JSON.stringify(todo),
  });
}

export function updateTodo(
  todoId: number,
  updates: TodoUpdates,
): Promise<Todo> {
  return request<Todo>(`/todos/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteTodo(todoId: number): Promise<void> {
  return request<void>(`/todos/${todoId}`, { method: "DELETE" });
}

export function getPostsForUser(userId: number): Promise<Post[]> {
  return request<Post[]>(`/posts?userId=${userId}`);
}

export async function createPost(post: NewPost): Promise<Post> {
  return request<Post>("/posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export function updatePost(
  postId: number,
  updates: PostUpdates,
): Promise<Post> {
  return request<Post>(`/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/posts/${postId}`, { method: "DELETE" });
}

export function getCommentsForPost(postId: number): Promise<Comment[]> {
  return request<Comment[]>(`/comments?postId=${postId}`);
}

export function createComment(comment: NewComment): Promise<Comment> {
  return request<Comment>("/comments", {
    method: "POST",
    body: JSON.stringify(comment),
  });
}

export function updateComment(
  commentId: number,
  updates: CommentUpdates,
): Promise<Comment> {
  return request<Comment>(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteComment(commentId: number): Promise<void> {
  return request<void>(`/comments/${commentId}`, { method: "DELETE" });
}

export function getAlbumsForUser(userId: number): Promise<Album[]> {
  return request<Album[]>(`/albums?userId=${userId}`);
}

export async function createAlbum(album: NewAlbum): Promise<Album> {
  return request<Album>("/albums", {
    method: "POST",
    body: JSON.stringify(album),
  });
}

export function getPhotosForAlbum(
  albumId: number,
  page = 1,
  limit = 12,
): Promise<Photo[]> {
  return request<Photo[]>(
    `/photos?albumId=${albumId}&_page=${page}&_limit=${limit}`,
  );
}

export async function createPhoto(photo: NewPhoto): Promise<Photo> {
  return request<Photo>("/photos", {
    method: "POST",
    body: JSON.stringify(photo),
  });
}

export function updatePhoto(
  photoId: number,
  updates: PhotoUpdates,
): Promise<Photo> {
  return request<Photo>(`/photos/${photoId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deletePhoto(photoId: number): Promise<void> {
  return request<void>(`/photos/${photoId}`, { method: "DELETE" });
}
