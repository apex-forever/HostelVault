import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const attendance = new Hono();
attendance.use('*', requireAuth);

attendance.get('/', async (c) => {
  const date = c.req.query('date');
  const rows = date
    ? normalizeRows(await db`SELECT * FROM attendance WHERE date = ${date}`)
    : normalizeRows(await db`SELECT * FROM attendance ORDER BY date DESC`);
  return c.json(rows);
});

// Body: { date, records: [{ studentId, status }] }
attendance.post('/bulk', requireRole('admin', 'warden'), async (c) => {
  const user = c.get('user');
  const { date, records } = await c.req.json();

  await db`DELETE FROM attendance WHERE date = ${date}`;

  for (const record of records || []) {
    await db`INSERT INTO attendance (studentId, date, status, markedBy) VALUES (${record.studentId}, ${date}, ${record.status}, ${user.name})`;
  }

  const rows = normalizeRows(await db`SELECT * FROM attendance WHERE date = ${date}`);
  return c.json(rows);
});

export default attendance;
