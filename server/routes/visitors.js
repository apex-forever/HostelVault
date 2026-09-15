import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { todayISO, nowTime } from '../utils/helpers.js';

const visitors = new Hono();
visitors.use('*', requireAuth);

visitors.get('/', async (c) => {
  const rows = normalizeRows(await db`SELECT * FROM visitors ORDER BY date DESC, id DESC`);
  return c.json(rows);
});

visitors.post('/', requireRole('admin', 'warden'), async (c) => {
  const b = await c.req.json();
  const rows = normalizeRows(
    await db`INSERT INTO visitors (studentId, visitorName, relation, purpose, date, timeIn, timeOut, status)
      VALUES (${b.studentId}, ${b.visitorName}, ${b.relation}, ${b.purpose}, ${todayISO()}, ${nowTime()}, NULL, 'visiting')
      RETURNING *`,
  );
  return c.json(rows[0], 201);
});

visitors.put('/:id/checkout', requireRole('admin', 'warden'), async (c) => {
  const id = c.req.param('id');
  const rows = normalizeRows(
    await db`UPDATE visitors SET timeOut = ${nowTime()}, status = 'completed' WHERE id = ${Number(id)} RETURNING *`,
  );
  return c.json(rows[0]);
});

export default visitors;
