import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { todayISO } from '../utils/helpers.js';

const complaints = new Hono();
complaints.use('*', requireAuth);

complaints.get('/', async (c) => {
  const user = c.get('user');
  const rows = user.role === 'student'
    ? normalizeRows(await db`SELECT * FROM complaints WHERE studentId = ${user.id} ORDER BY date DESC`)
    : normalizeRows(await db`SELECT * FROM complaints ORDER BY date DESC`);
  return c.json(rows);
});

complaints.post('/', async (c) => {
  const user = c.get('user');
  const b = await c.req.json();
  const studentId = user.role === 'student' ? user.id : b.studentId;

  const rows = normalizeRows(
    await db`INSERT INTO complaints (studentId, title, category, description, status, priority, date, response)
      VALUES (${studentId}, ${b.title}, ${b.category}, ${b.description}, 'pending', ${b.priority || 'medium'}, ${todayISO()}, NULL)
      RETURNING *`,
  );

  return c.json(rows[0], 201);
});

// Warden/admin respond to a complaint and update its status
complaints.put('/:id', requireRole('admin', 'warden'), async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const rows = normalizeRows(
    await db`UPDATE complaints SET status = ${b.status}, response = ${b.response} WHERE id = ${Number(id)} RETURNING *`,
  );
  return c.json(rows[0]);
});

export default complaints;
