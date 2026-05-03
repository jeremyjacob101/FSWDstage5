export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
  };
};

export type Todo = {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
};

export type Post = {
  id: number;
  userId: number;
  title: string;
  body: string;
};

export type Comment = {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
  ownedByCurrentUser?: boolean;
};

export type Album = {
  id: number;
  userId: number;
  title: string;
};

export type Photo = {
  id: number;
  albumId: number;
  title: string;
  url: string;
};
