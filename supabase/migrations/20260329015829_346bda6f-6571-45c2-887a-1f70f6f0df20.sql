-- Add unique constraint on live_responses for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS live_responses_session_block_user_uniq
  ON public.live_responses (live_session_id, lesson_block_id, user_id);

-- Deduplicate any existing duplicates before constraint (keep latest)
DELETE FROM public.live_responses a
USING public.live_responses b
WHERE a.live_session_id = b.live_session_id
  AND a.lesson_block_id = b.lesson_block_id
  AND a.user_id = b.user_id
  AND a.submitted_at < b.submitted_at;
