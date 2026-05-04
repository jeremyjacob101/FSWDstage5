import type { Album, Comment, Photo, Post, Todo, User } from "../data/types";
import { normalizeIds, normalizeUser, request, writeOptions } from "./helpers";
import type {
  CommentUpdates,
  NewAlbum,
  NewComment,
  NewPhoto,
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

  return users[0] ? normalizeUser(users[0]) : null;
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

  return normalizeUser(user);
}

export async function completeUserDetails(
  userId: number,
  details: NewUserDetails,
): Promise<User> {
  const user = await request<User>(
    `/users/${userId}`,
    writeOptions("PATCH", details),
  );

  return normalizeUser(user);
}

export async function getTodosForUser(userId: number): Promise<Todo[]> {
  const todos = await request<Todo[]>(`/todos?userId=${userId}`);
  return todos.map((todo) => normalizeIds(todo, "userId") as Todo);
}

export async function createTodo(todo: NewTodo): Promise<Todo> {
  const createdTodo = await request<Todo>("/todos", writeOptions("POST", todo));
  return normalizeIds(createdTodo, "userId") as Todo;
}

export async function updateTodo(
  todoId: number,
  updates: TodoUpdates,
): Promise<Todo> {
  const todo = await request<Todo>(
    `/todos/${todoId}`,
    writeOptions("PATCH", updates),
  );
  return normalizeIds(todo, "userId") as Todo;
}

export async function deleteTodo(todoId: number): Promise<void> {
  await request<void>(`/todos/${todoId}`, { method: "DELETE" });
}

export async function getPostsForUser(userId: number): Promise<Post[]> {
  const posts = await request<Post[]>(`/posts?userId=${userId}`);
  return posts.map((post) => normalizeIds(post, "userId") as Post);
}

export async function updatePost(
  postId: number,
  updates: PostUpdates,
): Promise<Post> {
  const post = await request<Post>(
    `/posts/${postId}`,
    writeOptions("PATCH", updates),
  );
  return normalizeIds(post, "userId") as Post;
}

export async function deletePost(postId: number): Promise<void> {
  await request<void>(`/posts/${postId}`, { method: "DELETE" });
}

export async function getCommentsForPost(postId: number): Promise<Comment[]> {
  const comments = await request<Comment[]>(`/comments?postId=${postId}`);
  return comments.map((comment) => normalizeIds(comment, "postId") as Comment);
}

export async function createComment(comment: NewComment): Promise<Comment> {
  const createdComment = await request<Comment>(
    "/comments",
    writeOptions("POST", comment),
  );
  return normalizeIds(createdComment, "postId") as Comment;
}

export async function updateComment(
  commentId: number,
  updates: CommentUpdates,
): Promise<Comment> {
  const comment = await request<Comment>(
    `/comments/${commentId}`,
    writeOptions("PATCH", updates),
  );
  return normalizeIds(comment, "postId") as Comment;
}

export async function deleteComment(commentId: number): Promise<void> {
  await request<void>(`/comments/${commentId}`, { method: "DELETE" });
}

export async function getAlbumsForUser(userId: number): Promise<Album[]> {
  const albums = await request<Album[]>(`/albums?userId=${userId}`);
  return albums.map((album) => normalizeIds(album, "userId") as Album);
}

export async function createAlbum(album: NewAlbum): Promise<Album> {
  const createdAlbum = await request<Album>(
    "/albums",
    writeOptions("POST", album),
  );
  return normalizeIds(createdAlbum, "userId") as Album;
}

export async function getPhotosForAlbum(
  albumId: number,
  page = 1,
  limit = 12,
): Promise<Photo[]> {
  const photos = await request<Photo[]>(
    `/photos?albumId=${albumId}&_page=${page}&_limit=${limit}`,
  );
  return photos.map((photo) => normalizeIds(photo, "albumId") as Photo);
}

export async function createPhoto(photo: NewPhoto): Promise<Photo> {
  const createdPhoto = await request<Photo>(
    "/photos",
    writeOptions("POST", photo),
  );
  return normalizeIds(createdPhoto, "albumId") as Photo;
}

export async function updatePhoto(
  photoId: number,
  updates: PhotoUpdates,
): Promise<Photo> {
  const photo = await request<Photo>(
    `/photos/${photoId}`,
    writeOptions("PATCH", updates),
  );
  return normalizeIds(photo, "albumId") as Photo;
}

export async function deletePhoto(photoId: number): Promise<void> {
  await request<void>(`/photos/${photoId}`, { method: "DELETE" });
}
