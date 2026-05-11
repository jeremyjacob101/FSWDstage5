export type TodoSort = "id" | "title" | "completed";

export type PostScope = "all" | "user";

export type PhotoChoice = {
  seed: number;
  url: string;
};

export const PHOTOS_PER_BATCH = 12;
export const PHOTO_CHOICES = 20;
export const PHOTOS_MAX_PICSUM_SEED = 1_000_000;
export const PHOTOS_MAX_RESTORED_PAGES = 30;
