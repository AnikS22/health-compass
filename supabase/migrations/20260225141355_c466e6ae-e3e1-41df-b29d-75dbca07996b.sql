
-- Clean all transactional/user data (order matters for FK constraints)
-- Live session related
DELETE FROM live_group_artifacts;
DELETE FROM live_group_members;
DELETE FROM live_groups;
DELETE FROM live_group_sets;
DELETE FROM live_responses;
DELETE FROM live_session_events;
DELETE FROM live_session_participants;
DELETE FROM live_sessions;

-- Assignments & attempts
DELETE FROM attempt_step_progress;
DELETE FROM attempt_responses;
DELETE FROM independent_attempts;
DELETE FROM assignment_targets;
DELETE FROM assignments;

-- Enrollments & classes
DELETE FROM class_enrollments;
DELETE FROM class_join_codes;
DELETE FROM classes;

-- Feedback, scores, badges, certificates
DELETE FROM teacher_feedback;
DELETE FROM rubric_scores;
DELETE FROM student_badges;
DELETE FROM certificates;

-- Moderation & audit
DELETE FROM moderation_flags;
DELETE FROM audit_logs;

-- Analytics
DELETE FROM analytics_daily_rollups;
DELETE FROM global_analytics_daily;

-- Auth identities (custom table, not auth schema)
DELETE FROM auth_identities;

-- User roles & users (clean slate)
DELETE FROM user_roles;
DELETE FROM users;

-- Org related
DELETE FROM organization_policy_settings;
DELETE FROM licenses;
DELETE FROM license_entitlements;
DELETE FROM organizations;
