
-- Insert into roles reference table
INSERT INTO roles (role_key) VALUES ('curriculum_admin') ON CONFLICT (role_key) DO NOTHING;

-- courses
CREATE POLICY "Curriculum admins can insert courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update courses"
ON public.courses FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete courses"
ON public.courses FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- units
CREATE POLICY "Curriculum admins can insert units"
ON public.units FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update units"
ON public.units FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete units"
ON public.units FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- lessons
CREATE POLICY "Curriculum admins can insert lessons"
ON public.lessons FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update lessons"
ON public.lessons FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete lessons"
ON public.lessons FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- lesson_versions
CREATE POLICY "Curriculum admins can insert lesson_versions"
ON public.lesson_versions FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update lesson_versions"
ON public.lesson_versions FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete lesson_versions"
ON public.lesson_versions FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- lesson_blocks
CREATE POLICY "Curriculum admins can insert lesson_blocks"
ON public.lesson_blocks FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update lesson_blocks"
ON public.lesson_blocks FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete lesson_blocks"
ON public.lesson_blocks FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- block_assets
CREATE POLICY "Curriculum admins can insert block_assets"
ON public.block_assets FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update block_assets"
ON public.block_assets FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete block_assets"
ON public.block_assets FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- curriculum_packages
CREATE POLICY "Curriculum admins can insert curriculum_packages"
ON public.curriculum_packages FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update curriculum_packages"
ON public.curriculum_packages FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete curriculum_packages"
ON public.curriculum_packages FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- standards_tags
CREATE POLICY "Curriculum admins can insert standards_tags"
ON public.standards_tags FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update standards_tags"
ON public.standards_tags FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete standards_tags"
ON public.standards_tags FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

-- lesson_standard_tags
CREATE POLICY "Curriculum admins can insert lesson_standard_tags"
ON public.lesson_standard_tags FOR INSERT TO authenticated
WITH CHECK (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can update lesson_standard_tags"
ON public.lesson_standard_tags FOR UPDATE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));

CREATE POLICY "Curriculum admins can delete lesson_standard_tags"
ON public.lesson_standard_tags FOR DELETE TO authenticated
USING (has_role(get_app_user_id(), 'curriculum_admin'::role_key));
