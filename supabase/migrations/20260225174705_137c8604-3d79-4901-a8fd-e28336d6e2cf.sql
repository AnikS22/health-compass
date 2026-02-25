
-- 1. Backfill missing public.users records for any auth.users that don't have one
INSERT INTO public.users (auth_user_id, email, display_name, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.email, au.id::text || '@supabase.local'),
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'User'),
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
WHERE pu.id IS NULL;

-- 2. Backfill missing user_roles for users without any role (default to student)
INSERT INTO public.user_roles (user_id, role_key)
SELECT u.id, 'student'::role_key
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;

-- 3. Add ethics_admin CRUD policies on curriculum tables

-- curriculum_packages
CREATE POLICY "Ethics admins can insert curriculum_packages"
  ON public.curriculum_packages FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update curriculum_packages"
  ON public.curriculum_packages FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete curriculum_packages"
  ON public.curriculum_packages FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- courses
CREATE POLICY "Ethics admins can insert courses"
  ON public.courses FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update courses"
  ON public.courses FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete courses"
  ON public.courses FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- units
CREATE POLICY "Ethics admins can insert units"
  ON public.units FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update units"
  ON public.units FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete units"
  ON public.units FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- lessons
CREATE POLICY "Ethics admins can insert lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update lessons"
  ON public.lessons FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete lessons"
  ON public.lessons FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- lesson_versions
CREATE POLICY "Ethics admins can insert lesson_versions"
  ON public.lesson_versions FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update lesson_versions"
  ON public.lesson_versions FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete lesson_versions"
  ON public.lesson_versions FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- lesson_blocks
CREATE POLICY "Ethics admins can insert lesson_blocks"
  ON public.lesson_blocks FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update lesson_blocks"
  ON public.lesson_blocks FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete lesson_blocks"
  ON public.lesson_blocks FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));

-- block_assets
CREATE POLICY "Ethics admins can insert block_assets"
  ON public.block_assets FOR INSERT
  WITH CHECK (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can update block_assets"
  ON public.block_assets FOR UPDATE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
CREATE POLICY "Ethics admins can delete block_assets"
  ON public.block_assets FOR DELETE
  USING (has_role(get_app_user_id(), 'ethics_admin'::role_key));
