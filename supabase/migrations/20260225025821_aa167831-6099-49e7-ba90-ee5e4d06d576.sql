
-- Enable RLS on all unprotected tables
ALTER TABLE public.analytics_daily_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_join_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.independent_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_standard_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_group_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_group_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_policy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standards_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;

-- Create security definer helper to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role role_key)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role_key = _role
  )
$$;

-- Helper: get user's app user id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- Helper: get user's organization_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- ============ READ-ONLY REFERENCE TABLES ============

-- badges: all authenticated can read
CREATE POLICY "Authenticated can read badges" ON public.badges FOR SELECT TO authenticated USING (true);

-- standards_tags: all authenticated can read
CREATE POLICY "Authenticated can read standards_tags" ON public.standards_tags FOR SELECT TO authenticated USING (true);

-- curriculum_packages: all authenticated can read
CREATE POLICY "Authenticated can read curriculum_packages" ON public.curriculum_packages FOR SELECT TO authenticated USING (true);

-- roles: all authenticated can read
CREATE POLICY "Authenticated can read roles" ON public.roles FOR SELECT TO authenticated USING (true);

-- block_assets: all authenticated can read
CREATE POLICY "Authenticated can read block_assets" ON public.block_assets FOR SELECT TO authenticated USING (true);

-- lesson_standard_tags: all authenticated can read
CREATE POLICY "Authenticated can read lesson_standard_tags" ON public.lesson_standard_tags FOR SELECT TO authenticated USING (true);

-- ============ ORG-SCOPED TABLES ============

-- organizations: members can read own org
CREATE POLICY "Members can read own org" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org_id());

-- organization_policy_settings: members can read own org settings
CREATE POLICY "Members can read own org policy" ON public.organization_policy_settings FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- licenses: members can read own org licenses
CREATE POLICY "Members can read own org licenses" ON public.licenses FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- license_entitlements: members can read via license
CREATE POLICY "Members can read own org entitlements" ON public.license_entitlements FOR SELECT TO authenticated
  USING (license_id IN (SELECT id FROM public.licenses WHERE organization_id = public.get_user_org_id()));

-- analytics_daily_rollups: org members can read
CREATE POLICY "Org members can read analytics" ON public.analytics_daily_rollups FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- global_analytics_daily: only ethics_admin can read
CREATE POLICY "Ethics admins can read global analytics" ON public.global_analytics_daily FOR SELECT TO authenticated
  USING (public.has_role(public.get_app_user_id(), 'ethics_admin'));

-- audit_logs: org members can read own org logs
CREATE POLICY "Org members can read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- moderation_flags: org members can read own org flags
CREATE POLICY "Org members can read moderation flags" ON public.moderation_flags FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- rubrics: authenticated can read (org-scoped or global)
CREATE POLICY "Authenticated can read rubrics" ON public.rubrics FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_user_org_id());

-- ============ CLASS/ASSIGNMENT TABLES ============

-- class_join_codes: org members can read
CREATE POLICY "Org members can read join codes" ON public.class_join_codes FOR SELECT TO authenticated
  USING (class_id IN (SELECT id FROM public.classes WHERE organization_id = public.get_user_org_id()));

-- assignments: org members can read
CREATE POLICY "Org members can read assignments" ON public.assignments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- assignment_targets: readable via assignment
CREATE POLICY "Org members can read assignment targets" ON public.assignment_targets FOR SELECT TO authenticated
  USING (assignment_id IN (SELECT id FROM public.assignments WHERE organization_id = public.get_user_org_id()));

-- ============ STUDENT PROGRESS TABLES ============

-- independent_attempts: users can read own, teachers can read org
CREATE POLICY "Users can read own attempts" ON public.independent_attempts FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());
CREATE POLICY "Users can insert own attempts" ON public.independent_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_app_user_id());
CREATE POLICY "Users can update own attempts" ON public.independent_attempts FOR UPDATE TO authenticated
  USING (user_id = public.get_app_user_id());

-- attempt_responses: users can read/insert own
CREATE POLICY "Users can read own attempt responses" ON public.attempt_responses FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());
CREATE POLICY "Users can insert own attempt responses" ON public.attempt_responses FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_app_user_id());

-- attempt_step_progress: users can read/insert/update own
CREATE POLICY "Users can read own step progress" ON public.attempt_step_progress FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());
CREATE POLICY "Users can insert own step progress" ON public.attempt_step_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_app_user_id());
CREATE POLICY "Users can update own step progress" ON public.attempt_step_progress FOR UPDATE TO authenticated
  USING (user_id = public.get_app_user_id());

-- certificates: users can read own
CREATE POLICY "Users can read own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());

-- student_badges: users can read own
CREATE POLICY "Users can read own badges" ON public.student_badges FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());

-- rubric_scores: users can read own scores
CREATE POLICY "Users can read own rubric scores" ON public.rubric_scores FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());

-- teacher_feedback: users can read feedback about themselves
CREATE POLICY "Users can read own feedback" ON public.teacher_feedback FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id());
-- Teachers can insert feedback
CREATE POLICY "Teachers can insert feedback" ON public.teacher_feedback FOR INSERT TO authenticated
  WITH CHECK (created_by_user_id = public.get_app_user_id());

-- ============ LIVE SESSION GROUP TABLES ============

-- live_group_sets: org members via session
CREATE POLICY "Org members can read group sets" ON public.live_group_sets FOR SELECT TO authenticated
  USING (live_session_id IN (SELECT id FROM public.live_sessions WHERE organization_id = public.get_user_org_id()));

-- live_groups: via group set
CREATE POLICY "Org members can read groups" ON public.live_groups FOR SELECT TO authenticated
  USING (live_group_set_id IN (SELECT id FROM public.live_group_sets WHERE live_session_id IN (SELECT id FROM public.live_sessions WHERE organization_id = public.get_user_org_id())));

-- live_group_members: via group
CREATE POLICY "Org members can read group members" ON public.live_group_members FOR SELECT TO authenticated
  USING (live_group_id IN (SELECT id FROM public.live_groups WHERE live_group_set_id IN (SELECT id FROM public.live_group_sets WHERE live_session_id IN (SELECT id FROM public.live_sessions WHERE organization_id = public.get_user_org_id()))));

-- live_group_artifacts: via group
CREATE POLICY "Org members can read group artifacts" ON public.live_group_artifacts FOR SELECT TO authenticated
  USING (live_group_id IN (SELECT id FROM public.live_groups WHERE live_group_set_id IN (SELECT id FROM public.live_group_sets WHERE live_session_id IN (SELECT id FROM public.live_sessions WHERE organization_id = public.get_user_org_id()))));

-- ============ AUTH_IDENTITIES: DENY ALL (sensitive) ============
-- No select policy = no access. Password hashes must never be exposed.
-- The handle_new_user trigger uses SECURITY DEFINER so it bypasses RLS.
