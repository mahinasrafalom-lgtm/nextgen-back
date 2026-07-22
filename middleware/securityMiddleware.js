export function sanitizePayload(req, _res, next) {
  const clean = (value) => {
    if (Array.isArray(value)) return value.map(clean);
    if (!value || typeof value !== 'object') return value;
    return Object.entries(value).reduce((result, [key, item]) => {
      if (!key.startsWith('$') && !key.includes('.')) result[key] = clean(item);
      return result;
    }, {});
  };
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
