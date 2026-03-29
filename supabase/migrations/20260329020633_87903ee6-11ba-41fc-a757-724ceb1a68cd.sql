CREATE POLICY "Users can update own participant record"
  ON public.live_session_participants
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));