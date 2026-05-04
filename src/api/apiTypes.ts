import type { User } from "../data/types";

export type NewUserDetails = {
  name: string;
  email: string;
  phone: string;
  address: User["address"];
  company: User["company"];
};

export type NewTodo = {
  userId: number;
  title: string;
  completed: boolean;
};

export type TodoUpdates = {
  title?: string;
  completed?: boolean;
};

export type PostUpdates = {
  title?: string;
  body?: string;
};

export type NewComment = {
  postId: number;
  name: string;
  email: string;
  body: string;
  ownedByCurrentUser?: boolean;
};

export type CommentUpdates = {
  body: string;
};

export type NewAlbum = {
  userId: number;
  title: string;
};

export type NewPhoto = {
  albumId: number;
  title: string;
  url: string;
};

export type PhotoUpdates = {
  title: string;
};
