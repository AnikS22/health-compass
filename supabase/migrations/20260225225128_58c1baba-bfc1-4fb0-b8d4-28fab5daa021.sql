-- Add optional email_domain column to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email_domain text;

-- Index for email domain lookups during auto-sorting
CREATE INDEX IF NOT EXISTS idx_organizations_email_domain ON public.organizations (email_domain) WHERE email_domain IS NOT NULL;