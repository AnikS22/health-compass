
-- Update handle_new_user to also assign a role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _app_user_id uuid;
  _role text;
BEGIN
  INSERT INTO public.users (auth_user_id, email, display_name, organization_id, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@supabase.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    (NEW.raw_app_meta_data->>'organization_id')::uuid,
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO _app_user_id;

  -- If user was just created, assign role
  IF _app_user_id IS NOT NULL THEN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    -- Validate role is valid
    IF _role IN ('student', 'teacher', 'school_admin', 'ethics_admin') THEN
      INSERT INTO public.user_roles (user_id, role_key)
      VALUES (_app_user_id, _role::role_key)
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role_key)
      VALUES (_app_user_id, 'student'::role_key)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the trigger (drop first to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also allow teachers to INSERT live_sessions
CREATE POLICY "Teachers can insert live_sessions"
ON public.live_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  host_teacher_id = get_app_user_id()
  AND organization_id = get_user_org_id()
  AND has_role(get_app_user_id(), 'teacher'::role_key)
);

-- Allow teachers to update their own live_sessions (e.g. end session)
CREATE POLICY "Teachers can update own live_sessions"
ON public.live_sessions
FOR UPDATE
TO authenticated
USING (
  host_teacher_id = get_app_user_id()
  AND organization_id = get_user_org_id()
)
WITH CHECK (
  host_teacher_id = get_app_user_id()
  AND organization_id = get_user_org_id()
);

-- Allow teachers to insert live_session_events for their sessions
CREATE POLICY "Teachers can insert live_session_events"
ON public.live_session_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_user_id = get_app_user_id()
  AND live_session_id IN (
    SELECT id FROM live_sessions
    WHERE host_teacher_id = get_app_user_id()
  )
);

-- Allow teachers to insert classes
CREATE POLICY "Teachers can insert classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = get_app_user_id()
  AND organization_id = get_user_org_id()
  AND has_role(get_app_user_id(), 'teacher'::role_key)
);

-- Allow teachers to update own classes
CREATE POLICY "Teachers can update own classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (teacher_id = get_app_user_id())
WITH CHECK (teacher_id = get_app_user_id());

-- Allow teachers to create assignments
CREATE POLICY "Teachers can insert assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
  assigned_by_user_id = get_app_user_id()
  AND organization_id = get_user_org_id()
  AND has_role(get_app_user_id(), 'teacher'::role_key)
);
