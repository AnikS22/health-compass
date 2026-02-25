
-- Create a class for the existing teacher user
INSERT INTO public.classes (id, name, grade_band, teacher_id, organization_id)
VALUES (
  gen_random_uuid(),
  'Ethics in AI - Period 1',
  'high_school',
  '665a6075-2eae-4f2b-979f-b769a3b05303',
  '598146b2-fb75-423d-8229-dc8342a755b9'
);
