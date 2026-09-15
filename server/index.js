import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { ensureSchema } from './db/connection.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import wardenRoutes from './routes/wardens.js';
import roomRoutes from './routes/rooms.js';
import blockRoutes from './routes/blocks.js';
import complaintRoutes from './routes/complaints.js';
import feeRoutes from './routes/fees.js';
import visitorRoutes from './routes/visitors.js';
import leaveRoutes from './routes/leaves.js';
import attendanceRoutes from './routes/attendance.js';
import noticeRoutes from './routes/notices.js';

await ensureSchema();
await seedDatabase(process.env.RESEED_ON_START === 'true');

const app = new Hono();

app.route('/api/auth', authRoutes);
app.route('/api/students', studentRoutes);
app.route('/api/wardens', wardenRoutes);
app.route('/api/rooms', roomRoutes);
app.route('/api/blocks', blockRoutes);
app.route('/api/complaints', complaintRoutes);
app.route('/api/fees', feeRoutes);
app.route('/api/visitors', visitorRoutes);
app.route('/api/leaves', leaveRoutes);
app.route('/api/attendance', attendanceRoutes);
app.route('/api/notices', noticeRoutes);

// Serve the front-end
app.use('/*', serveStatic({ root: './public' }));
app.get('*', serveStatic({ path: './public/index.html' }));

const port = Number(process.env.PORT) || 3000;
console.log(`HostelVault running at http://localhost:${port}`);

export default { port, hostname: '0.0.0.0', fetch: app.fetch };
