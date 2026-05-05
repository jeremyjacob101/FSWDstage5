const API_BASE_URL = "http://localhost:1837";

export function getNextNumericId(items: { id: number }[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
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
