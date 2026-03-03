
-- Allow school_admins to read their own org
-- (already covered by existing policies for most tables, but let's ensure key ones)

-- School admins can insert classes in their org
CREATE POLICY "School admins can insert classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

-- School admins can update classes in their org
CREATE POLICY "School admins can update org classes"
ON public.classes FOR UPDATE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
)
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

-- School admins can delete classes in their org
CREATE POLICY "School admins can delete org classes"
ON public.classes FOR DELETE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

-- School admins can manage enrollments in their org's classes
CREATE POLICY "School admins can insert enrollments"
ON public.class_enrollments FOR INSERT TO authenticated
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND class_id IN (SELECT id FROM classes WHERE organization_id = get_user_org_id())
);

CREATE POLICY "School admins can delete enrollments"
ON public.class_enrollments FOR DELETE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND class_id IN (SELECT id FROM classes WHERE organization_id = get_user_org_id())
);

-- School admins can read all enrollments in their org
CREATE POLICY "School admins can read org enrollments"
ON public.class_enrollments FOR SELECT TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND class_id IN (SELECT id FROM classes WHERE organization_id = get_user_org_id())
);

-- School admins can manage join codes for their org's classes
CREATE POLICY "School admins can insert join codes"
ON public.class_join_codes FOR INSERT TO authenticated
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND class_id IN (SELECT id FROM classes WHERE organization_id = get_user_org_id())
);

CREATE POLICY "School admins can update join codes"
ON public.class_join_codes FOR UPDATE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND class_id IN (SELECT id FROM classes WHERE organization_id = get_user_org_id())
);

CREATE POLICY "School admins can delete join codes"
ON public.class_join_codes FOR DELETE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND class_id IN (SELECT id FROM classes WHERE organization_id = get_user_org_id())
);

-- School admins can update their own org profile
CREATE POLICY "School admins can update own org"
ON public.organizations FOR UPDATE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND id = get_user_org_id()
)
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND id = get_user_org_id()
);

-- School admins can read their own org
CREATE POLICY "School admins can read own org"
ON public.organizations FOR SELECT TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND id = get_user_org_id()
);

-- School admins can update users in their org (activate/deactivate)
CREATE POLICY "School admins can update org users"
ON public.users FOR UPDATE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
)
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

-- School admins can manage policy settings for their org
CREATE POLICY "School admins can read own org policy"
ON public.organization_policy_settings FOR SELECT TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

CREATE POLICY "School admins can update own org policy"
ON public.organization_policy_settings FOR UPDATE TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

CREATE POLICY "School admins can insert own org policy"
ON public.organization_policy_settings FOR INSERT TO authenticated
WITH CHECK (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

-- School admins can read live sessions in their org
CREATE POLICY "School admins can read org live sessions"
ON public.live_sessions FOR SELECT TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);

-- School admins can read assignments in their org
CREATE POLICY "School admins can read org assignments"
ON public.assignments FOR SELECT TO authenticated
USING (
  has_role(get_app_user_id(), 'school_admin'::role_key)
  AND organization_id = get_user_org_id()
);
