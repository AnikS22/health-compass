
-- Add new Brilliant-style step types to block_type enum
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'concept_reveal';
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'micro_challenge';
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'reasoning_response';
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'peer_compare';

-- Add hints ladder column to lesson_blocks
-- Format: [{"level":1,"text":"Think about..."},{"level":2,"text":"Consider that..."},{"level":3,"text":"The answer involves..."}]
ALTER TABLE public.lesson_blocks ADD COLUMN IF NOT EXISTS hints jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add is_gate flag for mastery gates
ALTER TABLE public.lesson_blocks ADD COLUMN IF NOT EXISTS is_gate boolean NOT NULL DEFAULT false;

-- Add remediation_target_block_id for branching
ALTER TABLE public.lesson_blocks ADD COLUMN IF NOT EXISTS remediation_target_block_id uuid REFERENCES public.lesson_blocks(id);

-- Enable RLS on key tables used by the step runner
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies: curriculum content is readable by all authenticated users
CREATE POLICY "Authenticated users can read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read units" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lesson_versions" ON public.lesson_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lesson_blocks" ON public.lesson_blocks FOR SELECT TO authenticated USING (true);

-- Users can read their own user record
CREATE POLICY "Users can read own record" ON public.users FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- User roles readable by own user
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Live sessions: participants in same org can read
CREATE POLICY "Org members can read live_sessions" ON public.live_sessions FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Live session events readable by org members
CREATE POLICY "Org members can read live_session_events" ON public.live_session_events FOR SELECT TO authenticated USING (
  live_session_id IN (SELECT id FROM public.live_sessions WHERE organization_id IN (SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()))
);

-- Live responses: students can insert their own, teachers can read all in their session
CREATE POLICY "Students can insert own live_responses" ON public.live_responses FOR INSERT TO authenticated WITH CHECK (
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Org members can read live_responses" ON public.live_responses FOR SELECT TO authenticated USING (
  live_session_id IN (SELECT id FROM public.live_sessions WHERE organization_id IN (SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()))
);

-- Classes readable by org members
CREATE POLICY "Org members can read classes" ON public.classes FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Class enrollments readable by enrolled user or teacher
CREATE POLICY "Users can read own enrollments" ON public.class_enrollments FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  OR class_id IN (SELECT id FROM public.classes WHERE teacher_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
);

-- Live session participants
CREATE POLICY "Org members can read participants" ON public.live_session_participants FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can insert own participant record" ON public.live_session_participants FOR INSERT TO authenticated WITH CHECK (
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);
