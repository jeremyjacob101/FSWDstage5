import {
  ENTRYBASE_PENDING_REGISTRATION_KEY,
  ENTRYBASE_USER_KEY,
} from "../context/authStorageKeys";

export const API_BASE_URL = "http://localhost:1837";

function getStoredUserIdForApi(): number | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const loggedIn = localStorage.getItem(ENTRYBASE_USER_KEY);
    if (loggedIn) {
      const parsed = JSON.parse(loggedIn) as { id?: unknown };
      if (typeof parsed?.id === "number") {
        return parsed.id;
      }
    }
    const pending = localStorage.getItem(ENTRYBASE_PENDING_REGISTRATION_KEY);
    if (pending) {
      const parsed = JSON.parse(pending) as { id?: unknown };
      if (typeof parsed?.id === "number") {
        return parsed.id;
      }
    }
  } catch {
    return null;
  }
  return null;
}



//Finds the next available ID
//Iterates through all ids and finds the max. 
// Note: Might make sense to use a UUID. This is not a particularly efficient method. 
export function getNextNumericId(items: { id: number }[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

// 
// Parameters: method - Post method or Patch method
// Returns a RequestInit object - not fully sure what this is. 

export function writeOptions(
  method: "POST" | "PATCH",
  body: unknown,
): RequestInit {
  return {
    method,
    body: JSON.stringify(body),
  };
}


// Generic request function
// Parameters: path (string) and optional options(Request Init)
// Returns a generic promise
// Where is the Request Init declared/initialized
export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {


  const userId = getStoredUserIdForApi();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Why no-store? What is no-store? 
    cache: "no-store",
    // Does options contain headers? 
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

  // What is 204? 
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
