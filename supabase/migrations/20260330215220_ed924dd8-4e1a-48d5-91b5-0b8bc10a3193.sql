
-- Add waitlist_status enum
CREATE TYPE public.waitlist_status AS ENUM ('pending', 'approved', 'rejected');

-- Add waitlist_status column to users, default pending for new signups
ALTER TABLE public.users ADD COLUMN waitlist_status public.waitlist_status NOT NULL DEFAULT 'pending';

-- Set all existing users to approved so they aren't locked out
UPDATE public.users SET waitlist_status = 'approved';

-- Allow ethics admins to update waitlist_status (already have UPDATE on users via existing policies)
-- RLS: users can read their own waitlist_status (already covered by existing SELECT policies)

-- Update handle_new_user trigger to auto-approve admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _app_user_id uuid;
  _role text;
  _email_domain text;
  _matched_org_id uuid;
  _meta_org_id uuid;
  _waitlist waitlist_status;
BEGIN
  _email_domain := lower(split_part(COALESCE(NEW.email, ''), '@', 2));
  _meta_org_id := (NEW.raw_app_meta_data->>'organization_id')::uuid;

  IF _meta_org_id IS NULL AND _email_domain IS NOT NULL AND _email_domain <> '' THEN
    SELECT id INTO _matched_org_id
    FROM public.organizations
    WHERE lower(email_domain) = _email_domain
    LIMIT 1;
  ELSE
    _matched_org_id := _meta_org_id;
  END IF;

  -- Determine waitlist status: admin-created users (have org_id in metadata or role != student) are auto-approved
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF _meta_org_id IS NOT NULL OR _role != 'student' THEN
    _waitlist := 'approved';
  ELSE
    _waitlist := 'pending';
  END IF;

  INSERT INTO public.users (auth_user_id, email, display_name, organization_id, waitlist_status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@supabase.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    _matched_org_id,
    _waitlist,
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET organization_id = COALESCE(EXCLUDED.organization_id, users.organization_id),
        updated_at = NOW()
  RETURNING id INTO _app_user_id;

  IF _app_user_id IS NOT NULL THEN
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
