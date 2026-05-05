/** Require X-User-Id on API calls except login lookup and registration. */
module.exports = function authMiddleware(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const path = req.path || "/";

  if (req.method === "GET" && path === "/users") {
    return next();
  }

  if (req.method === "POST" && path === "/users") {
    return next();
  }

  const userId = String(req.headers["x-user-id"] ?? "").trim();
  if (!userId) {
    return res.status(401).json({ message: "Missing X-User-Id header" });
  }

  next();
};
