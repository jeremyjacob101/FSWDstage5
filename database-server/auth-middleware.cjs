const {
  findById,
  parsePositiveInt,
  rejectForbidden,
  rejectUnauthorized,
  toSingle,
} = require("./helpers.js");

function ensureOwnUserRoute(req, res, currentUserId, resourceId) {
  if (resourceId == null) {
    return rejectForbidden(res, "User collection access is not allowed");
  }
  if (resourceId !== currentUserId) {
    return rejectForbidden(res, "Cannot access another user's profile");
  }
  return null;
}

function ensureOwnDirectResource(
  req,
  res,
  currentUserId,
  resource,
  resourceId,
) {
  if (resourceId == null) {
    if (req.method === "GET") {
      req.query.userId = String(currentUserId);
      return null;
    }
    if (req.method === "POST") {
      req.body = {
        ...(req.body ?? {}),
        userId: currentUserId,
      };
      return null;
    }
    return rejectForbidden(res, "Operation not allowed");
  }

  const record = findById(req, resource, resourceId);
  if (!record) {
    return null;
  }
  if (Number(record.userId) !== currentUserId) {
    return rejectForbidden(res, "Cannot access another user's data");
  }

  if (req.method === "PATCH" && req.body?.userId != null) {
    req.body = {
      ...(req.body ?? {}),
      userId: currentUserId,
    };
  }

  return null;
}

function ensureOwnAlbum(req, res, currentUserId, albumId) {
  const album = findById(req, "albums", albumId);
  if (!album) {
    return res.status(404).json({ message: "Album not found" });
  }
  if (Number(album.userId) !== currentUserId) {
    return rejectForbidden(res, "Cannot access another user's album");
  }
  return null;
}

function ensureOwnPost(req, res, currentUserId, postId) {
  const post = findById(req, "posts", postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (Number(post.userId) !== currentUserId) {
    return rejectForbidden(res, "Cannot access another user's post");
  }
  return null;
}

function ensureOwnPhotoResource(req, res, currentUserId, resourceId) {
  if (resourceId == null) {
    const albumId =
      req.method === "GET"
        ? parsePositiveInt(toSingle(req.query.albumId))
        : parsePositiveInt(req.body?.albumId);
    if (albumId == null) {
      return rejectForbidden(res, "albumId is required");
    }
    return ensureOwnAlbum(req, res, currentUserId, albumId);
  }

  const photo = findById(req, "photos", resourceId);
  if (!photo) {
    return null;
  }

  const byExistingAlbum = ensureOwnAlbum(
    req,
    res,
    currentUserId,
    Number(photo.albumId),
  );
  if (byExistingAlbum) {
    return byExistingAlbum;
  }

  if (req.method === "PATCH" && req.body?.albumId != null) {
    const nextAlbumId = parsePositiveInt(req.body.albumId);
    if (nextAlbumId == null) {
      return rejectForbidden(res, "albumId must be a positive integer");
    }
    return ensureOwnAlbum(req, res, currentUserId, nextAlbumId);
  }

  return null;
}

function ensureOwnCommentResource(req, res, currentUserId, resourceId) {
  if (resourceId == null) {
    const postId =
      req.method === "GET"
        ? parsePositiveInt(toSingle(req.query.postId))
        : parsePositiveInt(req.body?.postId);
    if (postId == null) {
      return rejectForbidden(res, "postId is required");
    }
    return ensureOwnPost(req, res, currentUserId, postId);
  }

  const comment = findById(req, "comments", resourceId);
  if (!comment) {
    return null;
  }

  const byExistingPost = ensureOwnPost(
    req,
    res,
    currentUserId,
    Number(comment.postId),
  );
  if (byExistingPost) {
    return byExistingPost;
  }

  if (req.method === "PATCH" && req.body?.postId != null) {
    const nextPostId = parsePositiveInt(req.body.postId);
    if (nextPostId == null) {
      return rejectForbidden(res, "postId must be a positive integer");
    }
    return ensureOwnPost(req, res, currentUserId, nextPostId);
  }

  return null;
}

/** Enforce user ownership across resources. */
module.exports = function authMiddleware(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const path = req.path || "/";
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0] ?? "";
  const resourceId = parsePositiveInt(segments[1]);

  const isLoginLookup =
    req.method === "GET" &&
    (path === "/users" || path === "/login") &&
    typeof toSingle(req.query.username) === "string";
  const isRegistration =
    req.method === "POST" && (path === "/users" || path === "/register");
  if (isLoginLookup || isRegistration) {
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
    const result = ensureOwnUserRoute(req, res, currentUserId, resourceId);
    if (result) return result;
    return next();
  }

  if (resource === "todos" || resource === "posts" || resource === "albums") {
    const result = ensureOwnDirectResource(
      req,
      res,
      currentUserId,
      resource,
      resourceId,
    );
    if (result) return result;
    return next();
  }

  if (resource === "photos") {
    const result = ensureOwnPhotoResource(req, res, currentUserId, resourceId);
    if (result) return result;
    return next();
  }

  if (resource === "comments") {
    const result = ensureOwnCommentResource(
      req,
      res,
      currentUserId,
      resourceId,
    );
    if (result) return result;
    return next();
  }

  return next();
};
