import type { User } from "../data/types";

const API_BASE_URL = "http://localhost:1837";

type ServerUser = Omit<User, "id"> & {
  id: number | string;
};

function normalizeUser(user: ServerUser): User {
  return {
    ...user,
    id: Number(user.id),
  };
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const users = await request<ServerUser[]>(
    `/login?username=${encodeURIComponent(username)}`,
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
