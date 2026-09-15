# HostelVault — Hostel Management System

HostelVault is a hostel management application for admin, warden, and student roles. It runs on Bun with a Hono backend and a Neon PostgreSQL database, and serves a static frontend from the public folder.

## Overview

This project is a complete hostel management system with:

- admin and warden dashboards
- student management
- room and block management
- complaints tracking
- fee management
- visitor logs
- leave applications
- attendance tracking
- notices board
- profile and password updates

The app has evolved from a browser-only prototype into a proper server-backed system using a real database and authenticated API routes.

## Tech stack

- Bun runtime
- Hono web framework
- Neon PostgreSQL via `@neondatabase/serverless`
- Static frontend served by the backend
- Browser localStorage for the auth token only
- PostgreSQL schema with a clean-slate seed (bootstrap admin + empty hostel structure)

## Project structure

```text
hostelvault/
├── .env                    # local environment config (contains DATABASE_URL)
├── .env.example            # example env template
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── api.js          # fetch wrapper / bearer token logic
│       ├── auth.js         # session + login flows
│       ├── app.js          # app bootstrap
│       ├── router.js       # navigation logic
│       ├── utils.js        # shared helpers
│       └── pages/
├── server/
│   ├── index.js            # starts the Hono app and serves frontend
│   ├── db/
│   │   ├── connection.js   # Neon DB connection setup
│   │   ├── schema.sql      # PostgreSQL schema
│   │   └── seed.js         # creates the bootstrap admin + hostel structure, no demo records
│   ├── middleware/
│   │   └── auth.js         # route protection and role checks
│   ├── routes/
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── blocks.js
│   │   ├── complaints.js
│   │   ├── fees.js
│   │   ├── leaves.js
│   │   ├── notices.js
│   │   ├── rooms.js
│   │   ├── students.js
│   │   └── visitors.js
│   └── utils/
│       └── helpers.js
├── README.md
└── bun.lock
```

## Environment setup

1. Install Bun if needed:

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies:

```bash
bun install
```

3. Set up your environment file:

```bash
cp .env.example .env
```

Then make sure `.env` contains your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

4. Start the app:

```bash
bun run dev
```

5. Open the app in the browser:

```text
http://localhost:3000
```

## First login

The app starts with an empty database: no students, complaints, fees, visitors,
leave applications, attendance or notices. The only account created automatically
is a single bootstrap administrator, who then creates wardens (from the new
Wardens section) and students (from the Students section) directly in the app.

| Role  | Email | Password |
|---|---|---|
| Admin | value of `ADMIN_EMAIL`, defaults to `admin@hostelvault.com` | value of `ADMIN_PASSWORD`, defaults to `ChangeMe123!` |

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment before first deploy so
the bootstrap account is not left on the default password, and change the
password again from the Profile page immediately after your first login.

New warden accounts are created with a random temporary password, shown once in
the app right after creation, that you pass on to the warden yourself. There is
no self-registration.

## Database behavior

The app uses a PostgreSQL database (Neon) rather than SQLite. The database
connection is initialized in [server/db/connection.js](server/db/connection.js),
and the schema is defined in [server/db/schema.sql](server/db/schema.sql).

On startup, the app automatically creates any missing tables from
`schema.sql`, then creates the bootstrap admin account and the default hostel
block/room structure if the database is empty. It does not seed any student,
complaint, fee, visitor, leave, attendance or notice records.

## Important notes

- The frontend keeps the auth token in browser localStorage.
- The backend enforces protected routes and role access using the middleware in [server/middleware/auth.js](server/middleware/auth.js).
- The app is designed to run with a live Neon database; if the database is unavailable, the server will fail to start until a valid `DATABASE_URL` is supplied.
- Currency throughout the app is displayed as GHS (Ghana Cedis).
- There is no public "reset data" endpoint. To wipe and restart from a clean
  state, run `bun run seed` yourself (it truncates every table and recreates
  the bootstrap admin and hostel structure); this is not exposed in the UI.

## Project history

This project was originally built as a simpler browser-based hostel app and later evolved into a proper multi-role web app with a server-side API and database-backed persistence. The migration to Neon PostgreSQL was implemented so the app can run against a hosted production-ready database. It was subsequently cleaned up for production use: demo data removed, currency corrected to GHS, room pricing brought in line with real hostel fees, and warden accounts moved from hardcoded seed data to an in-app management screen.
