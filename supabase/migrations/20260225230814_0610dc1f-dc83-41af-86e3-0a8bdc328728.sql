
-- Step 1: Add curriculum_admin to the role_key enum
ALTER TYPE role_key ADD VALUE IF NOT EXISTS 'curriculum_admin';
