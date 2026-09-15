import { db, normalizeRows, tableIsEmpty } from './connection.js';

// Run directly with `bun run seed`, or imported by server/index.js on first start.
// This seed intentionally creates NO demo students, complaints, fees, visitors,
// leaves, attendance or notices. The only account created is a single bootstrap
// administrator, who then creates wardens and students from within the app.
export async function seedDatabase(force = false) {
  if (force) {
    const tables = ['sessions', 'attendance', 'leaves', 'notices', 'visitors', 'fees', 'complaints', 'rooms', 'blocks', 'users'];
    for (const table of tables) {
      await db.unsafe(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    }
  }

  const shouldSeedStructure = force || await tableIsEmpty('blocks') || await tableIsEmpty('rooms');

  // Bootstrap administrator. Override these with ADMIN_EMAIL / ADMIN_PASSWORD
  // environment variables before first deploy, then change the password from
  // the Profile page immediately after logging in.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostelvault.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const hashedAdminPassword = await Bun.password.hash(adminPassword);

  const existingAdmin = normalizeRows(await db`SELECT id FROM users WHERE email = ${adminEmail}`);
  if (!existingAdmin[0]) {
    await db`INSERT INTO users (name, email, password, role, phone, avatar, status)
      VALUES ('System Administrator', ${adminEmail}, ${hashedAdminPassword}, 'admin', NULL, 'SA', 'active')`;
    console.log(`[seed] Created bootstrap admin account: ${adminEmail}`);
  }

  if (!shouldSeedStructure) return;

  // Hostel blocks. These are structural defaults; rename or reassign wardens
  // to them from the app once real wardens have been created.
  const blocks = [
    { id: 'A', name: 'Block A', type: 'Male', floors: 3, roomsPerFloor: 10, warden: 'Unassigned', description: 'Male hostel block' },
    { id: 'B', name: 'Block B', type: 'Male', floors: 3, roomsPerFloor: 10, warden: 'Unassigned', description: 'Male hostel block' },
    { id: 'C', name: 'Block C', type: 'Female', floors: 3, roomsPerFloor: 8, warden: 'Unassigned', description: 'Female hostel block' },
    { id: 'D', name: 'Block D', type: 'Female', floors: 2, roomsPerFloor: 10, warden: 'Unassigned', description: 'Female hostel block' },
  ];

  for (const block of blocks) {
    await db`INSERT INTO blocks (id, name, type, floors, roomsPerFloor, warden, description)
      VALUES (${block.id}, ${block.name}, ${block.type}, ${block.floors}, ${block.roomsPerFloor}, ${block.warden}, ${block.description})
      ON CONFLICT (id) DO NOTHING`;
  }

  // Rooms, generated from the blocks above. Pricing reflects a realistic
  // Ghanaian hostel fee scale: GHS 5000 max for a single room per semester,
  // scaling down for shared rooms. All rooms start empty (available).
  for (const block of blocks) {
    for (let floor = 1; floor <= block.floors; floor++) {
      for (let roomNumber = 1; roomNumber <= block.roomsPerFloor; roomNumber++) {
        const id = `${block.id}-${floor}0${roomNumber}`;
        const cap = roomNumber <= 3 ? 1 : (roomNumber <= 7 ? 2 : 3);
        const type = cap === 1 ? 'Single' : cap === 2 ? 'Double' : 'Triple';
        const price = cap === 1 ? 5000 : cap === 2 ? 3500 : 2500;

        await db`INSERT INTO rooms (id, blockId, floor, number, capacity, type, status, price)
          VALUES (${id}, ${block.id}, ${floor}, ${id}, ${cap}, ${type}, 'available', ${price})
          ON CONFLICT (id) DO NOTHING`;
      }
    }
  }

  console.log('[seed] Database is ready: bootstrap admin created, hostel structure in place, no demo records.');
}

// Allow running directly: `bun run server/db/seed.js`
if (import.meta.main) {
  await seedDatabase(true);
  process.exit(0);
}
