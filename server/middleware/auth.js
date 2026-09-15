import { db, normalizeRows } from '../db/connection.js';

// Attaches req user to context if a valid token is supplied. Throws 401 otherwise.
export async function requireAuth(c, next) {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const sessionRows = normalizeRows(await db`SELECT * FROM sessions WHERE token = ${token}`);
  const session = sessionRows[0];
  if (!session) return c.json({ error: 'Invalid or expired session' }, 401);

  const userRows = normalizeRows(await db`SELECT * FROM users WHERE id = ${session.userId}`);
  const user = userRows[0];
  if (!user) return c.json({ error: 'User not found' }, 401);

  delete user.password;
  c.set('user', user);
  await next();
}

// Restrict a route to specific roles, e.g. requireRole('admin','warden')
export function requireRole(...roles) {
  return async (c, next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) return c.json({ error: 'Forbidden' }, 403);
    await next();
  };
}
