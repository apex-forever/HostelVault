import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { todayISO } from '../utils/helpers.js';

const leaves = new Hono();
leaves.use('*', requireAuth);

leaves.get('/', async (c) => {
  const user = c.get('user');
  const rows = user.role === 'student'
    ? normalizeRows(await db`SELECT * FROM leaves WHERE studentId = ${user.id} ORDER BY date DESC`)
    : normalizeRows(await db`SELECT * FROM leaves ORDER BY date DESC`);
  return c.json(rows);
});

leaves.post('/', async (c) => {
  const user = c.get('user');
  const b = await c.req.json();
  const studentId = user.role === 'student' ? user.id : b.studentId;
  const rows = normalizeRows(
    await db`INSERT INTO leaves (studentId, type, reason, fromDate, toDate, status, approvedBy, date, rejectReason)
      VALUES (${studentId}, ${b.type}, ${b.reason}, ${b.fromDate}, ${b.toDate}, 'pending', NULL, ${todayISO()}, NULL)
      RETURNING *`,
  );
  return c.json(rows[0], 201);
});

leaves.put('/:id/decide', requireRole('admin', 'warden'), async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json(); // { status: 'approved' | 'rejected', rejectReason? }
  const user = c.get('user');
  const rows = normalizeRows(
    await db`UPDATE leaves SET status = ${b.status}, approvedBy = ${user.name}, rejectReason = ${b.rejectReason || null} WHERE id = ${Number(id)} RETURNING *`,
  );
  return c.json(rows[0]);
});

export default leaves;
