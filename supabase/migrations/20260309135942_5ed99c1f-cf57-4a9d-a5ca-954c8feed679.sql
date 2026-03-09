-- Add audience_type enum and column to lessons
CREATE TYPE audience_type AS ENUM ('school', 'independent', 'both');

ALTER TABLE lessons ADD COLUMN audience_type audience_type NOT NULL DEFAULT 'both';