import type { PostScope } from "./page";
import type { TodoSort } from "./page";

export type TodosUiState = {
  search: string;
  sortBy: TodoSort;
  newTitle: string;
  editingTodoId: number | null;
  draftTitle: string;
};

export type PostsUiState = {
  search: string;
  postScope: PostScope;
  showComments: boolean;
  selectedPostId: number | null;
  newPostTitle: string;
  newPostBody: string;
  newComment: string;
  editingCommentId: number | null;
  draftCommentBody: string;
  editingPostId: number | null;
  draftPostTitle: string;
  draftPostBody: string;
};

export type AlbumsUiState = {
  search: string;
  newTitle: string;
};

export type PhotosUiState = {
  search: string;
  newTitle: string;
  selectedAddPhotoUrl: string;
  editingPhotoId: number | null;
  draftTitle: string;
  draftPhotoUrl: string;
  loadedPages: number;
};
