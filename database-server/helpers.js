export function parsePositiveInt(value) {
  const normalized =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : NaN;
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
}

export function toSingle(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function getCollection(req, name) {
  return req.app?.db?.get(name)?.value() ?? [];
}

export function findById(req, collection, id) {
  return getCollection(req, collection).find((item) => Number(item.id) === id);
}

export function rejectUnauthorized(res, message) {
  return res.status(401).json({ message });
}

export function rejectForbidden(res, message) {
  return res.status(403).json({ message });
}
