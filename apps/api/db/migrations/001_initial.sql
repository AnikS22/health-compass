-- psql migration entrypoint.
-- Execute from apps/api/db/migrations:
-- psql "$DATABASE_URL" -f 001_initial.sql
\i ../schema.sql
