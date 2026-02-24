CREATE UNIQUE INDEX IF NOT EXISTS live_sessions_id_org_unique
  ON live_sessions (id, organization_id);

UPDATE live_session_participants p
SET organization_id = s.organization_id
FROM live_sessions s
WHERE p.live_session_id = s.id
  AND p.organization_id <> s.organization_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'live_session_participants_session_org_fk'
  ) THEN
    ALTER TABLE live_session_participants
      ADD CONSTRAINT live_session_participants_session_org_fk
      FOREIGN KEY (live_session_id, organization_id)
      REFERENCES live_sessions(id, organization_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS live_session_events_session_created_idx
  ON live_session_events (live_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS live_session_participants_user_idx
  ON live_session_participants (user_id);

CREATE INDEX IF NOT EXISTS live_sessions_ended_started_idx
  ON live_sessions (ended_at, started_at DESC);
