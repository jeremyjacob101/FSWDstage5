export const API_BASE_URL = "http://localhost:1837";

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
  let userId: number | null = null;
  try {
    const loggedIn = localStorage.getItem("entryBaseUser");
    if (loggedIn) {
      userId = (JSON.parse(loggedIn) as { id: number }).id;
    } else {
      const pending = localStorage.getItem("entryBasePendingRegistration");
      if (pending) {
        userId = (JSON.parse(pending) as { id: number }).id;
      }
    }
  } catch {
    userId = null;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(userId != null ? { "X-User-Id": String(userId) } : {}),
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
