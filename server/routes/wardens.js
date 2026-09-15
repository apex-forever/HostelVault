import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { initials } from '../utils/helpers.js';

const wardens = new Hono();
wardens.use('*', requireAuth);

// Everyone authenticated can see the warden list (students need to know who
// runs their block); students get a trimmed view without contact details.
wardens.get('/', async (c) => {
  const user = c.get('user');
  if (user.role === 'student') {
    const rows = normalizeRows(await db`SELECT id, name, avatar, blockId, status FROM users WHERE role = 'warden' ORDER BY name`);
    return c.json(rows);
  }
  const rows = normalizeRows(await db`SELECT id, name, email, phone, avatar, blockId, status FROM users WHERE role = 'warden' ORDER BY name`);
  return c.json(rows);
});

wardens.post('/', requireRole('admin'), async (c) => {
  const b = await c.req.json();
  if (!b.name || !b.email) return c.json({ error: 'name and email are required' }, 400);

  const existing = normalizeRows(await db`SELECT id FROM users WHERE email = ${b.email}`);
  if (existing[0]) return c.json({ error: 'A user with this email already exists' }, 400);

  const tempPassword = crypto.randomUUID().slice(0, 10);
  const password = await Bun.password.hash(tempPassword);
  const rows = normalizeRows(
    await db`INSERT INTO users (name, email, password, role, phone, avatar, blockId, status)
      VALUES (${b.name}, ${b.email}, ${password}, 'warden', ${b.phone || null}, ${initials(b.name)}, ${b.blockId || null}, ${b.status || 'active'})
      RETURNING id, name, email, phone, avatar, blockId, status`,
  );
  return c.json({ ...rows[0], tempPassword }, 201);
});

wardens.put('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const rows = normalizeRows(
    await db`UPDATE users SET name = ${b.name}, email = ${b.email}, phone = ${b.phone || null}, avatar = ${initials(b.name)},
      blockId = ${b.blockId || null}, status = ${b.status || 'active'} WHERE id = ${Number(id)} AND role = 'warden'
      RETURNING id, name, email, phone, avatar, blockId, status`,
  );
  return c.json(rows[0]);
});

wardens.post('/:id/reset-password', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const tempPassword = crypto.randomUUID().slice(0, 10);
  const password = await Bun.password.hash(tempPassword);
  const rows = normalizeRows(
    await db`UPDATE users SET password = ${password}
      WHERE id = ${Number(id)} AND role = 'warden'
      RETURNING id, name, email`,
  );
  if (!rows[0]) return c.json({ error: 'Warden not found' }, 404);
  return c.json({ ...rows[0], tempPassword });
});

wardens.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  await db`DELETE FROM users WHERE id = ${Number(id)} AND role = 'warden'`;
  return c.json({ ok: true });
});

export default wardens;
