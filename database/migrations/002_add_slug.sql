-- =============================================
-- ADD SLUG SUPPORT TO CAMPAIGNS
-- Migration for Random Slugs Feature
-- =============================================

-- Add slug column to campaigns (if using SQL campaigns table)
-- For now, this is a reference for when we implement SQL campaigns
-- Current implementation uses Vercel KV for campaigns

ALTER TABLE IF EXISTS campaigns 
ADD COLUMN IF NOT EXISTS slug VARCHAR(10) UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_slug 
ON campaigns(slug);

COMMENT ON COLUMN campaigns.slug IS 
  'Random URL slug (e.g., Kcj7xLm) for secure, non-sequential campaign URLs';

-- Example query to find campaign by slug
-- SELECT * FROM campaigns WHERE slug = 'Kcj7xLm';
