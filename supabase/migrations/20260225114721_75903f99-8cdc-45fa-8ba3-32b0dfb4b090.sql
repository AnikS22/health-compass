
-- Function to join a live session by code
-- Sets student's organization_id if not already set
-- Creates participant record
-- Returns session id
CREATE OR REPLACE FUNCTION public.join_live_session_by_code(
  p_code text,
  p_display_name text DEFAULT 'Student'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_id uuid;
  _org_id uuid;
  _app_user_id uuid;
  _user_org_id uuid;
BEGIN
  -- Get app user id
  SELECT id, organization_id INTO _app_user_id, _user_org_id
  FROM public.users WHERE auth_user_id = auth.uid();

  IF _app_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User not found');
  END IF;

  -- Find session by code (case insensitive)
  SELECT id, organization_id INTO _session_id, _org_id
  FROM public.live_sessions
  WHERE session_code = UPPER(TRIM(p_code))
    AND ended_at IS NULL
  LIMIT 1;

  IF _session_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Session not found. Check the code and try again.');
  END IF;

  -- Set user's organization if not set
  IF _user_org_id IS NULL THEN
    UPDATE public.users SET organization_id = _org_id, updated_at = NOW()
    WHERE id = _app_user_id;
  END IF;

  -- Insert participant (ignore conflict if already joined)
  INSERT INTO public.live_session_participants (live_session_id, user_id, organization_id, display_name, join_kind)
  VALUES (_session_id, _app_user_id, _org_id, p_display_name, 'account')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'session_id', _session_id);
END;
$$;

-- Function to join a class by join code
-- Sets student's organization_id if not set
-- Creates enrollment record
CREATE OR REPLACE FUNCTION public.join_class_by_code(
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _class_id uuid;
  _org_id uuid;
  _app_user_id uuid;
  _user_org_id uuid;
BEGIN
  -- Get app user id
  SELECT id, organization_id INTO _app_user_id, _user_org_id
  FROM public.users WHERE auth_user_id = auth.uid();

  IF _app_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User not found');
  END IF;

  -- Find class by join code
  SELECT jc.class_id, c.organization_id INTO _class_id, _org_id
  FROM public.class_join_codes jc
  JOIN public.classes c ON c.id = jc.class_id
  WHERE jc.join_code = UPPER(TRIM(p_code))
    AND jc.is_active = true
    AND (jc.expires_at IS NULL OR jc.expires_at > NOW())
  LIMIT 1;

  IF _class_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired class code.');
  END IF;

  -- Set user's organization if not set
  IF _user_org_id IS NULL THEN
    UPDATE public.users SET organization_id = _org_id, updated_at = NOW()
    WHERE id = _app_user_id;
  END IF;

  -- Insert enrollment (ignore conflict)
  INSERT INTO public.class_enrollments (class_id, user_id, status)
  VALUES (_class_id, _app_user_id, 'active')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'class_id', _class_id);
END;
$$;
