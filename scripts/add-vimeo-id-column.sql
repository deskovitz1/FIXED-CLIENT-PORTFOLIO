-- Add vimeo_id column to videos table
-- Run this SQL directly in your database if pnpm db:push doesn't work

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS vimeo_id VARCHAR(50);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_vimeo_id ON videos(vimeo_id);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'videos' AND column_name = 'vimeo_id';

