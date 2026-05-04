import type { User } from "../data/types";

const API_BASE_URL = "http://localhost:1837";

export function normalizeUser(user: User): User {
  return {
    ...user,
    id: Number(user.id),
  };
}

export function normalizeIds<T extends { id: number | string }>(
  entity: T,
  relationKey: keyof T,
) {
  return {
    ...entity,
    id: Number(entity.id),
    [relationKey]: Number(entity[relationKey]),
  };
}

export function writeOptions(
  method: "POST" | "PATCH",
  body: unknown,
): RequestInit {
  return {
    method,
    body: JSON.stringify(body),
  };
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
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
