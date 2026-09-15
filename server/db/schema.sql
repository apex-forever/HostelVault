-- HostelVault database schema
-- One "users" table holds admins, wardens and students (students carry the extra columns).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','warden','student')),
  phone TEXT,
  avatar TEXT,
  blockId TEXT,
  regNo TEXT,
  department TEXT,
  level TEXT,
  roomId TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  floors INTEGER NOT NULL,
  roomsPerFloor INTEGER NOT NULL,
  warden TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  blockId TEXT NOT NULL,
  floor INTEGER NOT NULL,
  number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  price INTEGER NOT NULL,
  FOREIGN KEY(blockId) REFERENCES blocks(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  date TEXT NOT NULL,
  response TEXT,
  FOREIGN KEY(studentId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  session TEXT,
  semester TEXT,
  status TEXT DEFAULT 'pending',
  datePaid TEXT,
  ref TEXT,
  amountPaid INTEGER DEFAULT 0,
  FOREIGN KEY(studentId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL,
  visitorName TEXT NOT NULL,
  relation TEXT,
  purpose TEXT,
  date TEXT NOT NULL,
  timeIn TEXT,
  timeOut TEXT,
  status TEXT DEFAULT 'visiting',
  FOREIGN KEY(studentId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  date TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT
);

CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  fromDate TEXT,
  toDate TEXT,
  status TEXT DEFAULT 'pending',
  approvedBy TEXT,
  date TEXT NOT NULL,
  rejectReason TEXT,
  FOREIGN KEY(studentId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  markedBy TEXT,
  FOREIGN KEY(studentId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);
