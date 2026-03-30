
-- Add 'slides' to the block_type enum
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'slides';

-- Create storage bucket for slide images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slide-images', 'slide-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone authenticated can read slide images
CREATE POLICY "Authenticated users can read slide images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'slide-images');

-- RLS: teachers and admins can upload slide images
CREATE POLICY "Teachers can upload slide images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'slide-images'
  AND (
    public.has_role(public.get_app_user_id(), 'teacher')
    OR public.has_role(public.get_app_user_id(), 'ethics_admin')
    OR public.has_role(public.get_app_user_id(), 'curriculum_admin')
  )
);

-- RLS: teachers and admins can delete slide images
CREATE POLICY "Teachers can delete slide images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'slide-images'
  AND (
    public.has_role(public.get_app_user_id(), 'teacher')
    OR public.has_role(public.get_app_user_id(), 'ethics_admin')
    OR public.has_role(public.get_app_user_id(), 'curriculum_admin')
  )
);
