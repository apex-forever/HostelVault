import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const auth = new Hono();

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);

  const userRows = normalizeRows(await db`SELECT * FROM users WHERE email = ${email}`);
  const user = userRows[0];
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await Bun.password.verify(password, user.password);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = crypto.randomUUID();
  await db`INSERT INTO sessions (token, userId, createdAt) VALUES (${token}, ${user.id}, ${new Date().toISOString()})`;

  delete user.password;
  return c.json({ token, user });
});

auth.post('/logout', requireAuth, async (c) => {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.slice(7);
  await db`DELETE FROM sessions WHERE token = ${token}`;
  return c.json({ ok: true });
});

auth.get('/me', requireAuth, async (c) => {
  return c.json(c.get('user'));
});

auth.put('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const b = await c.req.json();
  const updatedRows = normalizeRows(
    await db`UPDATE users SET name = ${b.name}, email = ${b.email}, phone = ${b.phone} WHERE id = ${user.id} RETURNING *`,
  );
  const updated = updatedRows[0];
  delete updated.password;
  return c.json(updated);
});

auth.put('/password', requireAuth, async (c) => {
  const user = c.get('user');
  const { currentPassword, newPassword } = await c.req.json();
  const row = normalizeRows(await db`SELECT password FROM users WHERE id = ${user.id}`)[0];
  const valid = await Bun.password.verify(currentPassword, row.password);
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 400);
  const hashed = await Bun.password.hash(newPassword);
  await db`UPDATE users SET password = ${hashed} WHERE id = ${user.id}`;
  return c.json({ ok: true });
});

export default auth;
