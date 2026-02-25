
-- Allow teachers to delete their own assignments
CREATE POLICY "Teachers can delete own assignments"
ON public.assignments
FOR DELETE
USING (assigned_by_user_id = get_app_user_id() AND has_role(get_app_user_id(), 'teacher'::role_key));

-- Allow teachers to delete their own classes
CREATE POLICY "Teachers can delete own classes"
ON public.classes
FOR DELETE
USING (teacher_id = get_app_user_id() AND has_role(get_app_user_id(), 'teacher'::role_key));

-- Allow teachers to delete enrollments for their classes
CREATE POLICY "Teachers can delete enrollments for own classes"
ON public.class_enrollments
FOR DELETE
USING (class_id IN (SELECT id FROM classes WHERE teacher_id = get_app_user_id()));

-- Allow teachers to delete join codes for their classes
CREATE POLICY "Teachers can delete join codes for own classes"
ON public.class_join_codes
FOR DELETE
USING (class_id IN (SELECT id FROM classes WHERE teacher_id = get_app_user_id()));

-- Allow teachers to delete assignment targets for their assignments
CREATE POLICY "Teachers can delete own assignment targets"
ON public.assignment_targets
FOR DELETE
USING (assignment_id IN (SELECT id FROM assignments WHERE assigned_by_user_id = get_app_user_id()));
