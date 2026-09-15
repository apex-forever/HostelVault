import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const rooms = new Hono();
rooms.use('*', requireAuth);

rooms.get('/', async (c) => {
  const list = normalizeRows(await db`SELECT * FROM rooms ORDER BY id`);
  const occupants = normalizeRows(await db`SELECT id, name, roomId FROM users WHERE role = 'student' AND status = 'active'`);
  const withOccupants = list.map((r) => ({
    ...r,
    occupants: occupants.filter((o) => o.roomId === r.id).map((o) => ({ id: o.id, name: o.name })),
  }));
  return c.json(withOccupants);
});

rooms.post('/', requireRole('admin'), async (c) => {
  const b = await c.req.json();
  const cap = b.type === 'Single' ? 1 : b.type === 'Double' ? 2 : 3;
  const existingRows = normalizeRows(await db`SELECT COUNT(*)::int AS n FROM rooms WHERE blockId = ${b.blockId} AND floor = ${b.floor}`);
  const existing = Number(existingRows[0].n || 0);
  const id = `${b.blockId}-${b.floor}0${existing + 1}`;

  await db`INSERT INTO rooms (id, blockId, floor, number, capacity, type, status, price)
    VALUES (${id}, ${b.blockId}, ${b.floor}, ${id}, ${cap}, ${b.type}, 'available', ${Number(b.price)})`;

  const created = normalizeRows(await db`SELECT * FROM rooms WHERE id = ${id}`)[0];
  return c.json(created, 201);
});

rooms.put('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const cap = b.type === 'Single' ? 1 : b.type === 'Double' ? 2 : 3;
  const rows = normalizeRows(
    await db`UPDATE rooms SET blockId = ${b.blockId}, floor = ${b.floor}, type = ${b.type}, capacity = ${cap}, price = ${Number(b.price)} WHERE id = ${id} RETURNING *`,
  );
  return c.json(rows[0]);
});

export default rooms;
