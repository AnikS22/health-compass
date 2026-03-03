
-- Drop the problematic recursive policies on users
DROP POLICY IF EXISTS "Org members can read org users" ON public.users;
DROP POLICY IF EXISTS "Teachers can read enrolled students" ON public.users;

-- Recreate org members policy using the security definer function (no recursion)
CREATE POLICY "Org members can read org users"
ON public.users FOR SELECT TO authenticated
USING (organization_id = get_user_org_id());

-- Recreate teachers policy using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_teacher_student_ids(_teacher_app_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ce.user_id
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  WHERE c.teacher_id = _teacher_app_id
$$;

CREATE POLICY "Teachers can read enrolled students"
ON public.users FOR SELECT TO authenticated
USING (id IN (SELECT get_teacher_student_ids(get_app_user_id())));
