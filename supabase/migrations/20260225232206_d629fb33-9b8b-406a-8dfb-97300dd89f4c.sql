-- Fix handle_new_user trigger to include curriculum_admin as valid role
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

  IF _app_user_id IS NOT NULL THEN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    IF _role IN ('student', 'teacher', 'school_admin', 'ethics_admin', 'curriculum_admin') THEN
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