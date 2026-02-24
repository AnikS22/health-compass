# EthicsLabs Platform

Monorepo scaffold for a Nearpod/Edpuzzle-style Ethics Labs platform with:

- `apps/api`: backend APIs, realtime session sync, SQL migrations.
- `apps/web-student`: student experience app.
- `apps/web-teacher`: teacher dashboard app.
- `apps/web-admin`: school + Ethics Labs admin app.
- `packages/shared`: shared types/contracts across apps.

## Quick start

1. Install dependencies:
   - `npm install`
2. Start all dev services:
   - `npm run dev`
3. Run database migration files manually against PostgreSQL:
   - `apps/api/db/migrations/001_initial.sql`

## Notes

- Schema is SQL-first (PostgreSQL).
- Lesson content is versioned via `lesson_versions`.
- Live sessions use event append (`live_session_events`) for replay/debug.
