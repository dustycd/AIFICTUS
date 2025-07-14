/*
  # Remove unused metric columns from verifications table

  1. Changes
    - Remove `view_count` column (not provided by AI or Not API)
    - Remove `uploader_name` column (not provided by AI or Not API)
    
  2. Notes
    - These columns contain metrics we track ourselves, not data from the AI or Not API
    - All essential system columns and API-provided data columns are preserved
    - This migration is irreversible - the data in these columns will be lost
*/

-- Remove view_count column (UI metric we track, not from API)
ALTER TABLE verifications 
DROP COLUMN IF EXISTS view_count;

-- Remove uploader_name column (derived from user profile, not from API)
ALTER TABLE verifications 
DROP COLUMN IF EXISTS uploader_name;

-- Update any views or functions that might reference these columns
-- Note: The public_library_stats view and get_public_library_items function
-- may need to be updated if they reference these columns

-- Drop and recreate the public_library_stats view without view_count references
DROP VIEW IF EXISTS public_library_stats;

CREATE VIEW public_library_stats AS
SELECT 
  COUNT(*) as total_public_items,
  COUNT(*) FILTER (WHERE verification_status = 'authentic') as authentic_count,
  COUNT(*) FILTER (WHERE verification_status = 'suspicious') as suspicious_count,
  COUNT(*) FILTER (WHERE verification_status = 'fake') as fake_count,
  COUNT(*) FILTER (WHERE content_type LIKE 'video/%') as video_count,
  COUNT(*) FILTER (WHERE content_type LIKE 'image/%') as image_count,
  AVG(confidence_score) as avg_confidence_score,
  MAX(created_at) as latest_item_date,
  MIN(created_at) as earliest_item_date
FROM verifications 
WHERE is_public_library_item = true;