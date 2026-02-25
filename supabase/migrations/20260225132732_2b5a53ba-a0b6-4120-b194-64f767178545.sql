
-- Allow ethics_admin to read ALL users (not just own record)
CREATE POLICY "Ethics admins can read all users"
ON public.users FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to update any user (activate/deactivate, change org)
CREATE POLICY "Ethics admins can update all users"
ON public.users FOR UPDATE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all user_roles
CREATE POLICY "Ethics admins can read all roles"
ON public.user_roles FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to insert user_roles (assign roles)
CREATE POLICY "Ethics admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to delete user_roles (remove roles)
CREATE POLICY "Ethics admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read ALL organizations
CREATE POLICY "Ethics admins can read all orgs"
ON public.organizations FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to insert organizations
CREATE POLICY "Ethics admins can insert orgs"
ON public.organizations FOR INSERT
WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to update organizations
CREATE POLICY "Ethics admins can update orgs"
ON public.organizations FOR UPDATE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all classes
CREATE POLICY "Ethics admins can read all classes"
ON public.classes FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all assignments
CREATE POLICY "Ethics admins can read all assignments"
ON public.assignments FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all enrollments
CREATE POLICY "Ethics admins can read all enrollments"
ON public.class_enrollments FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to manage licenses
CREATE POLICY "Ethics admins can insert licenses"
ON public.licenses FOR INSERT
WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));

CREATE POLICY "Ethics admins can update licenses"
ON public.licenses FOR UPDATE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

CREATE POLICY "Ethics admins can read all licenses"
ON public.licenses FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to manage license_entitlements
CREATE POLICY "Ethics admins can insert entitlements"
ON public.license_entitlements FOR INSERT
WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));

CREATE POLICY "Ethics admins can update entitlements"
ON public.license_entitlements FOR UPDATE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

CREATE POLICY "Ethics admins can read all entitlements"
ON public.license_entitlements FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to manage org policy settings
CREATE POLICY "Ethics admins can read all policy settings"
ON public.organization_policy_settings FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

CREATE POLICY "Ethics admins can insert policy settings"
ON public.organization_policy_settings FOR INSERT
WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));

CREATE POLICY "Ethics admins can update policy settings"
ON public.organization_policy_settings FOR UPDATE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all analytics
CREATE POLICY "Ethics admins can read all org analytics"
ON public.analytics_daily_rollups FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all live sessions
CREATE POLICY "Ethics admins can read all live sessions"
ON public.live_sessions FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all audit logs
CREATE POLICY "Ethics admins can read all audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to read all moderation flags
CREATE POLICY "Ethics admins can read all moderation flags"
ON public.moderation_flags FOR SELECT
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- Allow ethics_admin to update moderation flags (resolve)
CREATE POLICY "Ethics admins can update moderation flags"
ON public.moderation_flags FOR UPDATE
USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
