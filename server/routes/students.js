import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { initials } from '../utils/helpers.js';

const students = new Hono();
students.use('*', requireAuth);

students.get('/', async (c) => {
  const rows = normalizeRows(await db`SELECT id, name, email, phone, avatar, blockId, regNo, department, level, roomId, status FROM users WHERE role = 'student' ORDER BY name`);
  return c.json(rows);
});

students.post('/', requireRole('admin', 'warden'), async (c) => {
  const b = await c.req.json();
  if (!b.name || !b.regNo || !b.email) return c.json({ error: 'name, regNo and email are required' }, 400);

  const password = await Bun.password.hash('student123');
  const rows = normalizeRows(
    await db`INSERT INTO users (name, email, password, role, phone, avatar, blockId, regNo, department, level, roomId, status)
      VALUES (${b.name}, ${b.email}, ${password}, 'student', ${b.phone || null}, ${initials(b.name)}, ${b.blockId || null}, ${b.regNo}, ${b.department || null}, ${b.level || null}, ${b.roomId || null}, ${b.status || 'active'})
      RETURNING id, name, email, phone, avatar, blockId, regNo, department, level, roomId, status`,
  );

  await syncRoomOccupancy();
  return c.json(rows[0], 201);
});

students.put('/:id', requireRole('admin', 'warden'), async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const rows = normalizeRows(
    await db`UPDATE users SET name = ${b.name}, email = ${b.email}, phone = ${b.phone || null}, avatar = ${initials(b.name)}, blockId = ${b.blockId || null},
      regNo = ${b.regNo}, department = ${b.department || null}, level = ${b.level || null}, roomId = ${b.roomId || null}, status = ${b.status || 'active'} WHERE id = ${Number(id)}
      RETURNING id, name, email, phone, avatar, blockId, regNo, department, level, roomId, status`,
  );
  await syncRoomOccupancy();
  return c.json(rows[0]);
});

students.delete('/:id', requireRole('admin', 'warden'), async (c) => {
  const id = c.req.param('id');
  await db`DELETE FROM users WHERE id = ${Number(id)} AND role = 'student'`;
  await syncRoomOccupancy();
  return c.json({ ok: true });
});

async function syncRoomOccupancy() {
  await db`
    WITH occupancy AS (
      SELECT rooms.id, rooms.capacity, COUNT(users.id)::int AS count
      FROM rooms
      LEFT JOIN users ON users.roomId = rooms.id AND users.status = 'active'
      GROUP BY rooms.id, rooms.capacity
    )
    UPDATE rooms
    SET status = CASE
      WHEN occupancy.count = 0 THEN 'available'
      WHEN occupancy.count >= occupancy.capacity THEN 'full'
      ELSE 'occupied'
    END
    FROM occupancy
    WHERE rooms.id = occupancy.id
  `;
}

export default students;
