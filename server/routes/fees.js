import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { todayISO } from '../utils/helpers.js';

const fees = new Hono();
fees.use('*', requireAuth);

fees.get('/', async (c) => {
  const user = c.get('user');
  const rows = user.role === 'student'
    ? normalizeRows(await db`SELECT * FROM fees WHERE studentId = ${user.id} ORDER BY id DESC`)
    : normalizeRows(await db`SELECT * FROM fees ORDER BY id DESC`);
  return c.json(rows);
});

fees.post('/', requireRole('admin', 'warden'), async (c) => {
  const b = await c.req.json();
  const rows = normalizeRows(
    await db`INSERT INTO fees (studentId, type, amount, session, semester, status, datePaid, ref, amountPaid)
      VALUES (${b.studentId}, ${b.type}, ${Number(b.amount)}, ${b.session}, ${b.semester}, 'pending', NULL, NULL, 0)
      RETURNING *`,
  );
  return c.json(rows[0], 201);
});

fees.put('/:id/pay', requireRole('admin', 'warden'), async (c) => {
  const id = c.req.param('id');
  const ref = `HV-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
  const rows = normalizeRows(
    await db`UPDATE fees SET status = 'paid', datePaid = ${todayISO()}, ref = ${ref}, amountPaid = amount WHERE id = ${Number(id)} RETURNING *`,
  );
  return c.json(rows[0]);
});

export default fees;
