-- Add new interactive block types to the block_type enum
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'peer_review';
ALTER TYPE public.block_type ADD VALUE IF NOT EXISTS 'group_challenge';