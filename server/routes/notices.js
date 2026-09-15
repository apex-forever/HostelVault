import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { todayISO } from '../utils/helpers.js';

const notices = new Hono();
notices.use('*', requireAuth);

notices.get('/', async (c) => {
  const rows = normalizeRows(await db`SELECT * FROM notices ORDER BY date DESC, id DESC`);
  return c.json(rows);
});

notices.post('/', requireRole('admin', 'warden'), async (c) => {
  const user = c.get('user');
  const b = await c.req.json();
  const rows = normalizeRows(
    await db`INSERT INTO notices (title, content, author, date, priority, category)
      VALUES (${b.title}, ${b.content}, ${user.name}, ${todayISO()}, ${b.priority || 'medium'}, ${b.category || 'General'})
      RETURNING *`,
  );
  return c.json(rows[0], 201);
});

notices.delete('/:id', requireRole('admin', 'warden'), async (c) => {
  await db`DELETE FROM notices WHERE id = ${Number(c.req.param('id'))}`;
  return c.json({ ok: true });
});

export default notices;
