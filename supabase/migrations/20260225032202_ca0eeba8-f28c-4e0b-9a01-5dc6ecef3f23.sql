
-- Assign teacher role to existing user
INSERT INTO public.user_roles (user_id, role_key) 
VALUES ('665a6075-2eae-4f2b-979f-b769a3b05303', 'teacher'::role_key) 
ON CONFLICT DO NOTHING;

-- Assign organization to existing user
UPDATE public.users 
SET organization_id = '598146b2-fb75-423d-8229-dc8342a755b9' 
WHERE id = '665a6075-2eae-4f2b-979f-b769a3b05303';
