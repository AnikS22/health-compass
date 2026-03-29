
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS custom_name text DEFAULT NULL;

-- Allow teachers to delete their own live sessions and related data
CREATE POLICY "Teachers can delete own live_sessions"
ON public.live_sessions
FOR DELETE
TO authenticated
USING (
  host_teacher_id = get_app_user_id()
  AND has_role(get_app_user_id(), 'teacher'::role_key)
);

-- Allow deleting related responses
CREATE POLICY "Teachers can delete responses for own sessions"
ON public.live_responses
FOR DELETE
TO authenticated
USING (
  live_session_id IN (
    SELECT id FROM live_sessions WHERE host_teacher_id = get_app_user_id()
  )
);

-- Allow deleting related events
CREATE POLICY "Teachers can delete events for own sessions"
ON public.live_session_events
FOR DELETE
TO authenticated
USING (
  live_session_id IN (
    SELECT id FROM live_sessions WHERE host_teacher_id = get_app_user_id()
  )
);

-- Allow deleting related participants
CREATE POLICY "Teachers can delete participants for own sessions"
ON public.live_session_participants
FOR DELETE
TO authenticated
USING (
  live_session_id IN (
    SELECT id FROM live_sessions WHERE host_teacher_id = get_app_user_id()
  )
);
