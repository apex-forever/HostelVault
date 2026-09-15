import { Hono } from 'hono';
import { db, normalizeRows } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const blocks = new Hono();
blocks.use('*', requireAuth);

blocks.get('/', async (c) => {
  const rows = normalizeRows(await db`SELECT * FROM blocks ORDER BY id`);
  return c.json(rows);
});

export default blocks;
