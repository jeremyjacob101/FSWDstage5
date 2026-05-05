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



// finds a user by username
// parameters: username(string)
// returns: Promise(User)
// Passes the users path with url safety. 
export async function findUserByUsername(
  username: string,
): Promise<User | null> {
  const users = await request<User[]>(
    `/users?username=${encodeURIComponent(username)}`,
  );

  return users[0] ?? null;
}

// Authenticate users
// parameters: username(string), password(string)
// returns: Promise(User | null )
// Finds a user by Username and checks if the password matches
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
  return request<User>(
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
}

export function completeUserDetails(
  userId: number,
  details: NewUserDetails,
): Promise<User> {
  return request<User>(`/users/${userId}`, writeOptions("PATCH", details));
}

export function getTodosForUser(userId: number): Promise<Todo[]> {
  return request<Todo[]>(`/todos?userId=${userId}`);
}

export async function createTodo(todo: NewTodo): Promise<Todo> {
  const currentTodos = await request<Todo[]>("/todos");

  return request<Todo>(
    "/todos",
    writeOptions("POST", { ...todo, id: getNextNumericId(currentTodos) }),
  );
}

export function updateTodo(
  todoId: number,
  updates: TodoUpdates,
): Promise<Todo> {
  return request<Todo>(`/todos/${todoId}`, writeOptions("PATCH", updates));
}

export function deleteTodo(todoId: number): Promise<void> {
  return request<void>(`/todos/${todoId}`, { method: "DELETE" });
}

export function getPostsForUser(userId: number): Promise<Post[]> {
  return request<Post[]>(`/posts?userId=${userId}`);
}

export async function createPost(post: NewPost): Promise<Post> {
  const currentPosts = await request<Post[]>("/posts");

  return request<Post>(
    "/posts",
    writeOptions("POST", { ...post, id: getNextNumericId(currentPosts) }),
  );
}

export function updatePost(
  postId: number,
  updates: PostUpdates,
): Promise<Post> {
  return request<Post>(`/posts/${postId}`, writeOptions("PATCH", updates));
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/posts/${postId}`, { method: "DELETE" });
}

export function getCommentsForPost(postId: number): Promise<Comment[]> {
  return request<Comment[]>(`/comments?postId=${postId}`);
}

export function createComment(comment: NewComment): Promise<Comment> {
  return request<Comment>("/comments", writeOptions("POST", comment));
}

export function updateComment(
  commentId: number,
  updates: CommentUpdates,
): Promise<Comment> {
  return request<Comment>(
    `/comments/${commentId}`,
    writeOptions("PATCH", updates),
  );
}

export function deleteComment(commentId: number): Promise<void> {
  return request<void>(`/comments/${commentId}`, { method: "DELETE" });
}

export function getAlbumsForUser(userId: number): Promise<Album[]> {
  return request<Album[]>(`/albums?userId=${userId}`);
}

export function createAlbum(album: NewAlbum): Promise<Album> {
  return request<Album>("/albums", writeOptions("POST", album));
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

export function createPhoto(photo: NewPhoto): Promise<Photo> {
  return request<Photo>("/photos", writeOptions("POST", photo));
}

export function updatePhoto(
  photoId: number,
  updates: PhotoUpdates,
): Promise<Photo> {
  return request<Photo>(`/photos/${photoId}`, writeOptions("PATCH", updates));
}

export function deletePhoto(photoId: number): Promise<void> {
  return request<void>(`/photos/${photoId}`, { method: "DELETE" });
}
