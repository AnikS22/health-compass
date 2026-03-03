-- Allow users in the same organization to see each other
CREATE POLICY "Org members can read org users"
ON public.users
FOR SELECT
TO authenticated
USING (organization_id = get_user_org_id());

-- Allow teachers to read users enrolled in their classes (even if different org or no org)
CREATE POLICY "Teachers can read enrolled students"
ON public.users
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ce.user_id FROM class_enrollments ce
    JOIN classes c ON c.id = ce.class_id
    WHERE c.teacher_id = get_app_user_id()
  )
);