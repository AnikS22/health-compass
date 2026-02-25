
-- Allow teachers to insert class join codes for their own classes
CREATE POLICY "Teachers can insert join codes for own classes"
ON public.class_join_codes
FOR INSERT
TO authenticated
WITH CHECK (
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = get_app_user_id()
  )
);

-- Allow teachers to update join codes for their own classes
CREATE POLICY "Teachers can update join codes for own classes"
ON public.class_join_codes
FOR UPDATE
TO authenticated
USING (
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = get_app_user_id()
  )
);

-- Allow anyone authenticated to read join codes (needed for students to look up by code)
DROP POLICY IF EXISTS "Org members can read join codes" ON public.class_join_codes;
CREATE POLICY "Authenticated can read join codes"
ON public.class_join_codes
FOR SELECT
TO authenticated
USING (true);

-- Allow students to insert their own class_enrollments when joining via code
CREATE POLICY "Students can enroll themselves"
ON public.class_enrollments
FOR INSERT
TO authenticated
WITH CHECK (user_id = get_app_user_id());
