-- Allow students to update their own live responses (for upsert)
CREATE POLICY "Students can update own live_responses"
  ON public.live_responses
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
