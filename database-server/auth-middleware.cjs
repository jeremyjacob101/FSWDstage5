const {
  findById,
  parsePositiveInt,
  rejectForbidden,
  rejectUnauthorized,
  toSingle,
} = require("./helpers.js");

function ensureOwnedRecord(req, res, collection, id, currentUserId, message) {
  if (id == null) {
    return true;
  }

  const record = findById(req, collection, id);
  if (!record) {
    return true;
  }

  if (Number(record.userId) !== currentUserId) {
    rejectForbidden(res, message);
    return false;
  }

  return true;
}

function ensureOwnedAlbum(req, res, currentUserId, albumId) {
  const album = findById(req, "albums", albumId);
  if (!album) {
    res.status(404).json({ message: "Album not found" });
    return false;
  }

  if (Number(album.userId) !== currentUserId) {
    rejectForbidden(res, "Cannot access another user's album");
    return false;
  }

  return true;
}

module.exports = function authMiddleware(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const path = req.path || "/";
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0] ?? "";
  const resourceId = parsePositiveInt(segments[1]);

  const isAuthLookup =
    req.method === "GET" &&
    (path === "/users" || path === "/login") &&
    typeof toSingle(req.query.username) === "string";
  const isRegistration =
    req.method === "POST" && (path === "/users" || path === "/register");
  if (isAuthLookup || isRegistration) {
    return next();
  }

  const currentUserId = parsePositiveInt(req.headers["x-user-id"]);
  if (currentUserId == null) {
    return rejectUnauthorized(res, "Missing or invalid X-User-Id header");
  }

  const currentUser = findById(req, "users", currentUserId);
  if (!currentUser) {
    return rejectUnauthorized(res, "Unknown user");
  }

  if (resource === "users") {
    if (resourceId == null || resourceId !== currentUserId) {
      return rejectForbidden(res, "Cannot access another user's profile");
    }
    return next();
  }

  if (resource === "todos" || resource === "albums") {
    if (req.method === "GET") {
      req.query.userId = String(currentUserId);
      return next();
    }

    if (req.method === "POST") {
      req.body = { ...(req.body ?? {}), userId: currentUserId };
      return next();
    }

    const isAllowed = ensureOwnedRecord(
      req,
      res,
      resource,
      resourceId,
      currentUserId,
      "Cannot access another user's data",
    );
    if (!isAllowed) {
      return;
    }

    if (req.method === "PATCH") {
      req.body = { ...(req.body ?? {}), userId: currentUserId };
    }

    return next();
  }

  if (resource === "posts") {
    if (req.method === "POST") {
      req.body = { ...(req.body ?? {}), userId: currentUserId };
      return next();
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      const isAllowed = ensureOwnedRecord(
        req,
        res,
        "posts",
        resourceId,
        currentUserId,
        "Cannot modify another user's post",
      );
      if (!isAllowed) {
        return;
      }

      if (req.method === "PATCH") {
        req.body = { ...(req.body ?? {}), userId: currentUserId };
      }
    }

    return next();
  }

  if (resource === "photos") {
    if (resourceId == null) {
      const albumId = parsePositiveInt(
        req.method === "GET" ? toSingle(req.query.albumId) : req.body?.albumId,
      );
      if (albumId == null) {
        return rejectForbidden(res, "albumId is required");
      }

      const isAllowed = ensureOwnedAlbum(req, res, currentUserId, albumId);
      if (!isAllowed) {
        return;
      }

      return next();
    }

    const photo = findById(req, "photos", resourceId);
    if (photo) {
      const isAllowed = ensureOwnedAlbum(
        req,
        res,
        currentUserId,
        Number(photo.albumId),
      );
      if (!isAllowed) {
        return;
      }
    }

    if (req.method === "PATCH" && req.body?.albumId != null) {
      const nextAlbumId = parsePositiveInt(req.body.albumId);
      if (nextAlbumId == null) {
        return rejectForbidden(res, "albumId must be a positive integer");
      }

      const isAllowed = ensureOwnedAlbum(req, res, currentUserId, nextAlbumId);
      if (!isAllowed) {
        return;
      }
    }

    return next();
  }

  if (resource === "comments") {
    if (req.method === "POST") {
      req.body = {
        ...(req.body ?? {}),
        userId: currentUserId,
        email: currentUser.email,
        name: currentUser.name,
      };
      return next();
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      const comment = findById(req, "comments", resourceId);
      if (comment && Number(comment.userId) !== currentUserId) {
        return rejectForbidden(res, "Cannot modify another user's comment");
      }

      if (req.method === "PATCH") {
        req.body = {
          ...(req.body ?? {}),
          userId: currentUserId,
          email: currentUser.email,
          name: currentUser.name,
          ...(comment ? { postId: Number(comment.postId) } : {}),
        };
      }
    }

    return next();
  }

  return next();
};
