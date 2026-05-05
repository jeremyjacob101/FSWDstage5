import type { Album, Comment, Photo, Post, Todo, User } from "../data/types";
import { getNextNumericId, request, writeOptions } from "./helpers";
import type {
  CommentUpdates,
  NewAlbum,
  NewComment,
  NewPhoto,
  NewPost,
  NewTodo,
  NewUserDetails,
  PhotoUpdates,
  PostUpdates,
  TodoUpdates,
} from "./apiTypes";

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

export async function createRegisteredUser({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<User> {
  const user = await request<User>(
    "/register",
    writeOptions("POST", {
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
  );

  return user;
}

export async function completeUserDetails(
  userId: number,
  details: NewUserDetails,
): Promise<User> {
  const user = await request<User>(
    `/users/${userId}`,
    writeOptions("PATCH", details),
  );

  return user;
}

export async function getTodosForUser(userId: number): Promise<Todo[]> {
  return request<Todo[]>(`/todos?userId=${userId}`);
}

export async function createTodo(todo: NewTodo): Promise<Todo> {
  const currentTodos = await request<Todo[]>("/todos");
  const createdTodo = await request<Todo>(
    "/todos",
    writeOptions("POST", { ...todo, id: getNextNumericId(currentTodos) }),
  );
  return createdTodo;
}

export async function updateTodo(
  todoId: number,
  updates: TodoUpdates,
): Promise<Todo> {
  return request<Todo>(`/todos/${todoId}`, writeOptions("PATCH", updates));
}

export async function deleteTodo(todoId: number): Promise<void> {
  await request<void>(`/todos/${todoId}`, { method: "DELETE" });
}

export async function getPostsForUser(userId: number): Promise<Post[]> {
  return request<Post[]>(`/posts?userId=${userId}`);
}

export async function createPost(post: NewPost): Promise<Post> {
  const currentPosts = await request<Post[]>("/posts");
  const createdPost = await request<Post>(
    "/posts",
    writeOptions("POST", { ...post, id: getNextNumericId(currentPosts) }),
  );
  return createdPost;
}

export async function updatePost(
  postId: number,
  updates: PostUpdates,
): Promise<Post> {
  return request<Post>(`/posts/${postId}`, writeOptions("PATCH", updates));
}

export async function deletePost(postId: number): Promise<void> {
  await request<void>(`/posts/${postId}`, { method: "DELETE" });
}

export async function getCommentsForPost(postId: number): Promise<Comment[]> {
  return request<Comment[]>(`/comments?postId=${postId}`);
}

export async function createComment(comment: NewComment): Promise<Comment> {
  return request<Comment>("/comments", writeOptions("POST", comment));
}

export async function updateComment(
  commentId: number,
  updates: CommentUpdates,
): Promise<Comment> {
  return request<Comment>(
    `/comments/${commentId}`,
    writeOptions("PATCH", updates),
  );
}

export async function deleteComment(commentId: number): Promise<void> {
  await request<void>(`/comments/${commentId}`, { method: "DELETE" });
}

export async function getAlbumsForUser(userId: number): Promise<Album[]> {
  return request<Album[]>(`/albums?userId=${userId}`);
}

export async function createAlbum(album: NewAlbum): Promise<Album> {
  return request<Album>("/albums", writeOptions("POST", album));
}

export async function getPhotosForAlbum(
  albumId: number,
  page = 1,
  limit = 12,
): Promise<Photo[]> {
  return request<Photo[]>(
    `/photos?albumId=${albumId}&_page=${page}&_limit=${limit}`,
  );
}

export async function createPhoto(photo: NewPhoto): Promise<Photo> {
  return request<Photo>("/photos", writeOptions("POST", photo));
}

export async function updatePhoto(
  photoId: number,
  updates: PhotoUpdates,
): Promise<Photo> {
  return request<Photo>(`/photos/${photoId}`, writeOptions("PATCH", updates));
}

export async function deletePhoto(photoId: number): Promise<void> {
  await request<void>(`/photos/${photoId}`, { method: "DELETE" });
}
