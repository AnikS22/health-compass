-- Allow ethics admins to insert live sessions
CREATE POLICY "Ethics admins can insert live_sessions"
ON public.live_sessions FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics admins to update live sessions
CREATE POLICY "Ethics admins can update live_sessions"
ON public.live_sessions FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow school admins to insert live sessions (for their org)
CREATE POLICY "School admins can insert live_sessions"
ON public.live_sessions FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'school_admin'::role_key) AND organization_id = get_user_org_id());

-- Allow school admins to read org live sessions
CREATE POLICY "School admins can read org live_sessions"
ON public.live_sessions FOR SELECT TO authenticated
USING (has_role(get_app_user_id(), 'school_admin'::role_key) AND organization_id = get_user_org_id());

-- Allow school admins to update org live sessions
CREATE POLICY "School admins can update org live_sessions"
ON public.live_sessions FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'school_admin'::role_key) AND organization_id = get_user_org_id());