CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE role_key AS ENUM ('student', 'teacher', 'school_admin', 'ethics_admin');
CREATE TYPE enrollment_status AS ENUM ('active', 'invited', 'removed');
CREATE TYPE publish_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE block_type AS ENUM (
  'video',
  'poll',
  'mcq',
  'multi_select',
  'short_answer',
  'scenario',
  'dilemma_tree',
  'drag_drop',
  'matching',
  'debate',
  'group_board',
  'collaborative_board',
  'drawing',
  'red_team',
  'exit_ticket'
);
CREATE TYPE assignment_target_type AS ENUM ('class', 'group', 'student');
CREATE TYPE participant_join_kind AS ENUM ('account', 'guest');
CREATE TYPE step_status AS ENUM ('locked', 'unlocked', 'completed', 'retry');
CREATE TYPE moderation_source_type AS ENUM ('live_response', 'independent_response', 'board_post');
CREATE TYPE moderation_reason AS ENUM ('pii', 'profanity', 'safety', 'other');
CREATE TYPE moderation_resolution_status AS ENUM ('open', 'resolved', 'dismissed');

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tenant_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key role_key UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_key role_key NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_key)
);

CREATE TABLE auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_subject TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_subject)
);

CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  seat_limit INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE curriculum_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE license_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  curriculum_package_id UUID NOT NULL REFERENCES curriculum_packages(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (license_id, curriculum_package_id)
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE class_enrollments (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  accommodations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, user_id)
);

CREATE TABLE class_join_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  join_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_package_id UUID REFERENCES curriculum_packages(id),
  title TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  difficulty TEXT,
  grade_band TEXT,
  estimated_minutes INTEGER,
  learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  sensitive_topic_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  publish_status publish_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lesson_id, version_label)
);

CREATE TABLE lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_version_id UUID NOT NULL REFERENCES lesson_versions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  block_type block_type NOT NULL,
  title TEXT,
  body TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  remediation_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  mastery_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lesson_version_id, sequence_no)
);

CREATE TABLE block_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_block_id UUID NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  captions_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE standards_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE (framework, code)
);

CREATE TABLE lesson_standard_tags (
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  standards_tag_id UUID NOT NULL REFERENCES standards_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, standards_tag_id)
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_version_id UUID NOT NULL REFERENCES lesson_versions(id),
  assigned_by_user_id UUID NOT NULL REFERENCES users(id),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  target_type assignment_target_type NOT NULL,
  target_ref_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE independent_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (assignment_id, user_id)
);

CREATE TABLE attempt_step_progress (
  independent_attempt_id UUID NOT NULL REFERENCES independent_attempts(id) ON DELETE CASCADE,
  lesson_block_id UUID NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status step_status NOT NULL,
  score NUMERIC(5,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (independent_attempt_id, lesson_block_id, user_id)
);

CREATE TABLE attempt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  independent_attempt_id UUID NOT NULL REFERENCES independent_attempts(id) ON DELETE CASCADE,
  lesson_block_id UUID NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence INTEGER,
  score NUMERIC(5,2),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  lesson_version_id UUID NOT NULL REFERENCES lesson_versions(id),
  host_teacher_id UUID NOT NULL REFERENCES users(id),
  session_code TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX live_sessions_id_org_unique
  ON live_sessions (id, organization_id);

CREATE TABLE live_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  display_name TEXT NOT NULL,
  join_kind participant_join_kind NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

ALTER TABLE live_session_participants
  ADD CONSTRAINT live_session_participants_session_org_fk
  FOREIGN KEY (live_session_id, organization_id)
  REFERENCES live_sessions(id, organization_id);

CREATE TABLE live_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE live_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  lesson_block_id UUID NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX live_session_participants_unique_user
  ON live_session_participants (live_session_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX live_responses_unique_student_block
  ON live_responses (live_session_id, lesson_block_id, user_id);

CREATE INDEX live_session_events_session_created_idx
  ON live_session_events (live_session_id, created_at DESC);

CREATE INDEX live_session_participants_user_idx
  ON live_session_participants (user_id);

CREATE INDEX live_sessions_ended_started_idx
  ON live_sessions (ended_at, started_at DESC);

CREATE TABLE live_group_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  grouping_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE live_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_group_set_id UUID NOT NULL REFERENCES live_group_sets(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE live_group_members (
  live_group_id UUID NOT NULL REFERENCES live_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (live_group_id, user_id)
);

CREATE TABLE live_group_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_group_id UUID NOT NULL REFERENCES live_groups(id) ON DELETE CASCADE,
  lesson_block_id UUID REFERENCES lesson_blocks(id),
  artifact_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rubric_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  context_type TEXT NOT NULL,
  context_ref_id UUID NOT NULL,
  score_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teacher_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  context_type TEXT NOT NULL,
  context_ref_id UUID NOT NULL,
  feedback_text TEXT NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  lesson_version_id UUID NOT NULL REFERENCES lesson_versions(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_url TEXT
);

CREATE TABLE moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type moderation_source_type NOT NULL,
  source_id UUID NOT NULL,
  flag_reason moderation_reason NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolution_status moderation_resolution_status NOT NULL DEFAULT 'open',
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  actor_user_id UUID REFERENCES users(id),
  action_key TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analytics_daily_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  active_teachers INTEGER NOT NULL DEFAULT 0,
  active_students INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (organization_id, metric_date)
);

CREATE TABLE global_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE UNIQUE NOT NULL,
  total_joins INTEGER NOT NULL DEFAULT 0,
  total_starts INTEGER NOT NULL DEFAULT 0,
  total_finishes INTEGER NOT NULL DEFAULT 0,
  retention_d7 NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE organization_policy_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  allow_guest_live_join BOOLEAN NOT NULL DEFAULT TRUE,
  pii_filter_level TEXT NOT NULL DEFAULT 'standard',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (role_key) VALUES
('student'),
('teacher'),
('school_admin'),
('ethics_admin')
ON CONFLICT (role_key) DO NOTHING;
