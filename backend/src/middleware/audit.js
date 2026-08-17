import AuditLog from '../models/AuditLog.js';

/**
 * Logs mutating admin API calls (POST/PUT/PATCH/DELETE under /api/admin).
 */
export const auditAdminActions = (req, res, next) => {
  const method = req.method;
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();

  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const actor = req.user?._id;
    AuditLog.create({
      actor,
      action: `${method} ${req.originalUrl.split('?')[0]}`,
      resource: req.baseUrl || 'admin',
      resourceId: req.params?.id || req.body?._id || undefined,
      method,
      path: req.originalUrl,
      ip: req.ip,
      meta: {
        durationMs: Date.now() - start,
        bodyKeys: req.body ? Object.keys(req.body).slice(0, 20) : [],
      },
      statusCode: res.statusCode,
    }).catch(() => {});
    return originalJson(body);
  };
  next();
};

export const listAuditLogs = async ({ limit = 100, actor, resource } = {}) => {
  const filter = {};
  if (actor) filter.actor = actor;
  if (resource) filter.resource = resource;
  return AuditLog.find(filter).populate('actor', 'name email role').sort('-createdAt').limit(Number(limit));
};
