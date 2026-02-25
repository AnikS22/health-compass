-- Add ethics_admin role to existing user aniksahai@icloud.com
INSERT INTO user_roles (user_id, role_key)
VALUES ('665a6075-2eae-4f2b-979f-b769a3b05303', 'ethics_admin'::role_key)
ON CONFLICT (user_id, role_key) DO NOTHING;