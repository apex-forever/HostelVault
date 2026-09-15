import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it before starting the app.');
}

export const db = neon(connectionString);

// Reads schema.sql and creates any missing tables. Safe to call every
// startup, every statement is CREATE TABLE IF NOT EXISTS.
export async function ensureSchema() {
  const schemaSql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  const withoutComments = schemaSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  const statements = withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await db.unsafe(statement);
  }
}


const KNOWN_KEY_MAP = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  phone: 'phone',
  avatar: 'avatar',
  blockid: 'blockId',
  regno: 'regNo',
  department: 'department',
  level: 'level',
  roomid: 'roomId',
  status: 'status',
  title: 'title',
  category: 'category',
  description: 'description',
  priority: 'priority',
  date: 'date',
  response: 'response',
  type: 'type',
  amount: 'amount',
  session: 'session',
  semester: 'semester',
  datepaid: 'datePaid',
  ref: 'ref',
  amountpaid: 'amountPaid',
  studentid: 'studentId',
  visitorname: 'visitorName',
  relation: 'relation',
  purpose: 'purpose',
  timein: 'timeIn',
  timeout: 'timeOut',
  author: 'author',
  content: 'content',
  fromdate: 'fromDate',
  todate: 'toDate',
  approvedby: 'approvedBy',
  rejectreason: 'rejectReason',
  markedby: 'markedBy',
  token: 'token',
  createdat: 'createdAt',
  userid: 'userId',
  blockid: 'blockId',
  floor: 'floor',
  number: 'number',
  capacity: 'capacity',
  price: 'price',
  userid: 'userId',
  firstname: 'firstName',
  lastname: 'lastName',
  fullname: 'fullName',
  count: 'count',
  n: 'n',
};

export function normalizeRow(row = {}) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      const normalizedKey = KNOWN_KEY_MAP[String(key).toLowerCase()] || String(key);
      return [normalizedKey, value];
    }),
  );
}

export function normalizeRows(rows) {
  if (!Array.isArray(rows)) return normalizeRow(rows);
  return rows.map((row) => normalizeRow(row));
}

export async function tableIsEmpty(table) {
  const rows = await db.unsafe(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return Number(rows[0]?.count ?? 0) === 0;
}
