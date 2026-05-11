import type { MiddlewareRequest, MiddlewareResponse } from "../src/types/auth";

export default function authMiddleware(
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  next: () => void,
) {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const path = req.path || "/";
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0] ?? "";
  const resourceId = Number(segments[1]);

  const usernameValue = req.query.username;
  const username = Array.isArray(usernameValue)
    ? usernameValue[0]
    : usernameValue;
  const isAuthLookup =
    req.method === "GET" &&
    (path === "/users" || path === "/login") &&
    typeof username === "string";
  const isRegistration =
    req.method === "POST" && (path === "/users" || path === "/register");
  if (isAuthLookup || isRegistration) {
    next();
    return;
  }

  const currentUserId = Number(req.headers["x-user-id"]);
  if (!currentUserId) {
    res.status(401).json({ message: "Missing or invalid X-User-Id header" });
    return;
  }

  const currentUser = (req.app?.db?.get("users")?.value() ?? []).find(
    (item) => Number(item.id) === currentUserId,
  );
  if (!currentUser) {
    res.status(401).json({ message: "Unknown user" });
    return;
  }

  if (resource === "users") {
    if (resourceId == null || resourceId !== currentUserId) {
      res.status(403).json({ message: "Cannot access another user's profile" });
      return;
    }
    next();
    return;
  }

  if (resource === "todos" || resource === "albums") {
    if (req.method === "GET") {
      req.query.userId = String(currentUserId);
      next();
      return;
    }

    if (req.method === "POST") {
      req.body = { ...(req.body ?? {}), userId: currentUserId };
      next();
      return;
    }

    const isAllowed = ensureOwnedResource(
      req,
      res,
      resource,
      resourceId,
      currentUserId,
      { forbiddenMessage: "Cannot access another user's data" },
    );
    if (!isAllowed) {
      return;
    }

    if (req.method === "PATCH") {
      req.body = { ...(req.body ?? {}), userId: currentUserId };
    }

    next();
    return;
  }

  if (resource === "posts") {
    if (req.method === "POST") {
      req.body = { ...(req.body ?? {}), userId: currentUserId };
      next();
      return;
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      const isAllowed = ensureOwnedResource(
        req,
        res,
        "posts",
        resourceId,
        currentUserId,
        { forbiddenMessage: "Cannot modify another user's post" },
      );
      if (!isAllowed) {
        return;
      }

      if (req.method === "PATCH") {
        req.body = { ...(req.body ?? {}), userId: currentUserId };
      }
    }

    next();
    return;
  }

  if (resource === "photos") {
    if (resourceId == null) {
      const albumId = Number(
        req.method === "GET"
          ? Array.isArray(req.query.albumId)
            ? req.query.albumId[0]
            : req.query.albumId
          : req.body?.albumId,
      );

      const isAllowed = ensureOwnedResource(
        req,
        res,
        "albums",
        albumId,
        currentUserId,
        {
          notFoundMessage: "Album not found",
          forbiddenMessage: "Cannot access another user's album",
        },
      );
      if (!isAllowed) {
        return;
      }

      next();
      return;
    }

    const photo = (req.app?.db?.get("photos")?.value() ?? []).find(
      (item) => Number(item.id) === resourceId,
    );
    if (photo) {
      const isAllowed = ensureOwnedResource(
        req,
        res,
        "albums",
        Number(photo.albumId),
        currentUserId,
        {
          notFoundMessage: "Album not found",
          forbiddenMessage: "Cannot access another user's album",
        },
      );
      if (!isAllowed) {
        return;
      }
    }

    if (req.method === "PATCH" && req.body?.albumId != null) {
      const nextAlbumId = Number(req.body.albumId);

      const isAllowed = ensureOwnedResource(
        req,
        res,
        "albums",
        nextAlbumId,
        currentUserId,
        {
          notFoundMessage: "Album not found",
          forbiddenMessage: "Cannot access another user's album",
        },
      );
      if (!isAllowed) {
        return;
      }
    }

    next();
    return;
  }

  if (resource === "comments") {
    if (req.method === "POST") {
      req.body = {
        ...(req.body ?? {}),
        userId: currentUserId,
        email: String(currentUser.email ?? ""),
        name: String(currentUser.name ?? ""),
      };
      next();
      return;
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      const comment = (req.app?.db?.get("comments")?.value() ?? []).find(
        (item) => Number(item.id) === resourceId,
      );
      if (comment && Number(comment.userId) !== currentUserId) {
        res
          .status(403)
          .json({ message: "Cannot modify another user's comment" });
        return;
      }

      if (req.method === "PATCH") {
        req.body = {
          ...(req.body ?? {}),
          userId: currentUserId,
          email: String(currentUser.email ?? ""),
          name: String(currentUser.name ?? ""),
          ...(comment ? { postId: Number(comment.postId) } : {}),
        };
      }
    }

    next();
    return;
  }

  next();
}

function ensureOwnedResource(
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  collection: string,
  id: number | null,
  currentUserId: number,
  options?: {
    forbiddenMessage?: string;
    notFoundMessage?: string;
  },
) {
  if (id == null) {
    return true;
  }

  const record = (req.app?.db?.get(collection)?.value() ?? []).find(
    (item) => Number(item.id) === id,
  );
  if (!record) {
    if (options?.notFoundMessage) {
      res.status(404).json({ message: options.notFoundMessage });
      return false;
    }
    return true;
  }

  if (Number(record.userId) !== currentUserId) {
    res.status(403).json({
      message: options?.forbiddenMessage ?? "Cannot access another user's data",
    });
    return false;
  }

  return true;
}
