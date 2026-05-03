import type { Album, Comment, Photo, Post, Todo, User } from "./types";

export const mockUser: User = {
  id: 1,
  name: "Leanne Graham",
  username: "Bret",
  email: "Sincere@april.biz",
  phone: "1-770-736-8031 x56442",
  website: "hildegard.org",
  company: {
    name: "Romaguera-Crona",
    catchPhrase: "Multi-layered client-server neural-net",
    bs: "harness real-time e-markets",
  },
  address: {
    street: "Kulas Light",
    suite: "Apt. 556",
    city: "Gwenborough",
    zipcode: "92998-3874",
  },
};

export const mockTodos: Todo[] = [
  {
    id: 1,
    userId: 1,
    title: "Confirm client onboarding checklist",
    completed: true,
  },
  {
    id: 2,
    userId: 1,
    title: "Prepare Monday planning notes",
    completed: false,
  },
  {
    id: 3,
    userId: 1,
    title: "Archive completed launch tasks",
    completed: true,
  },
  { id: 4, userId: 1, title: "Update content calendar", completed: false },
  {
    id: 5,
    userId: 1,
    title: "Review album references for homepage refresh",
    completed: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: 1,
    userId: 1,
    title: "Weekly operations brief",
    body: "This week is focused on tightening intake, trimming stale tasks, and getting the next content batch ready for review before Thursday afternoon.",
  },
  {
    id: 2,
    userId: 1,
    title: "Launch notes for the spring collection",
    body: "The spring collection needs a short launch note, three supporting images, and a final pass on comments from the account team.",
  },
  {
    id: 3,
    userId: 1,
    title: "Client workspace cleanup",
    body: "Remove duplicated references, rename the active albums, and keep only the files that support the current client direction.",
  },
];

export const mockComments: Comment[] = [
  {
    id: 1,
    postId: 1,
    name: "Leanne Graham",
    email: "bret@entrybase.local",
    body: "I added the intake checklist and moved the loose items into the active task list.",
    ownedByCurrentUser: true,
  },
  {
    id: 2,
    postId: 1,
    name: "Clementine Bauch",
    email: "clementine@entrybase.local",
    body: "The Thursday review window still works. I will add final notes before then.",
  },
  {
    id: 3,
    postId: 2,
    name: "Leanne Graham",
    email: "bret@entrybase.local",
    body: "The image set is in good shape. We only need one stronger cover option.",
    ownedByCurrentUser: true,
  },
  {
    id: 4,
    postId: 3,
    name: "Patricia Lebsack",
    email: "patricia@entrybase.local",
    body: "I renamed the archive album and left the active client set untouched.",
  },
];

export const mockAlbums: Album[] = [
  { id: 1, userId: 1, title: "Client launch references" },
  { id: 2, userId: 1, title: "Product detail shots" },
  { id: 3, userId: 1, title: "Workspace inspiration" },
];

export const mockPhotos: Photo[] = Array.from({ length: 24 }, (_, index) => {
  const id = index + 1;

  return {
    id,
    albumId: (index % 3) + 1,
    title: `Reference image ${id}`,
    url: `https://picsum.photos/seed/entrybase-${id}/640/420`,
  };
});
