
-- Allow independent attempts without an assignment (for self-paced students)
ALTER TABLE public.independent_attempts 
  ALTER COLUMN assignment_id DROP NOT NULL;

-- Add lesson_version_id for direct self-paced tracking
ALTER TABLE public.independent_attempts 
  ADD COLUMN lesson_version_id uuid REFERENCES public.lesson_versions(id);

-- Create index for self-paced lookups
CREATE INDEX idx_independent_attempts_lesson_version 
  ON public.independent_attempts(user_id, lesson_version_id);
