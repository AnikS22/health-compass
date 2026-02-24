ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS live_session_participants_unique_user
  ON live_session_participants (live_session_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS live_responses_unique_student_block
  ON live_responses (live_session_id, lesson_block_id, user_id);
