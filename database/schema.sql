-- =============================================
-- Cloaker Platform - Postgres Schema
-- Migration from Vercel KV (Redis) to Postgres
-- Solves: Cost explosion + Scalability
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- VISIT LOGS TABLE
-- High-volume append-only data
-- Optimized for time-series queries
-- =============================================

CREATE TABLE visit_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Campaign Reference
  campaign_id VARCHAR(50) NOT NULL,
  
  -- Timestamp (indexed for range queries)
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Request Info (GDPR-compliant)
  ip_hash VARCHAR(64) NOT NULL,  -- SHA256 hash (not plain IP)
  user_agent TEXT,
  referer TEXT,
  country VARCHAR(2),             -- ISO country code
  
  -- Detection Results
  is_bot BOOLEAN NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  probability REAL NOT NULL CHECK (probability >= 0.0 AND probability <= 1.0),
  
  -- Page Served
  page_served VARCHAR(10) NOT NULL CHECK (page_served IN ('safe', 'real')),
  
  -- Detection Details (JSONB for flexibility)
  detection_details JSONB,
  -- Example: {"referer": {"score": 95, "reasons": [...]}, ...}
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_visit_logs_campaign_timestamp ON visit_logs(campaign_id, timestamp DESC);
CREATE INDEX idx_visit_logs_timestamp ON visit_logs(timestamp DESC);
CREATE INDEX idx_visit_logs_campaign_bot ON visit_logs(campaign_id, is_bot);
CREATE INDEX idx_visit_logs_ip_hash ON visit_logs(ip_hash);

-- Partial index for bots only (smaller, faster)
CREATE INDEX idx_visit_logs_bots ON visit_logs(campaign_id, timestamp DESC) 
WHERE is_bot = true;

-- GIN index for JSONB queries
CREATE INDEX idx_visit_logs_detection_details ON visit_logs USING GIN (detection_details);

-- =============================================
-- CLICK LOGS TABLE
-- Tracks actual clicks on CTAs
-- Links to visit_logs
-- =============================================

CREATE TABLE click_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Key to visit_logs
  visit_log_id UUID REFERENCES visit_logs(id) ON DELETE CASCADE,
  
  -- Campaign Reference (denormalized for perf)
  campaign_id VARCHAR(50) NOT NULL,
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Event Info
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('click', 'conversion')),
  element_clicked VARCHAR(100),
  
  -- Additional metadata
  metadata JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_click_logs_campaign_timestamp ON click_logs(campaign_id, timestamp DESC);
CREATE INDEX idx_click_logs_visit ON click_logs(visit_log_id);
CREATE INDEX idx_click_logs_event_type ON click_logs(campaign_id, event_type);

-- =============================================
-- MATERIALIZED VIEW: Campaign Stats
-- Pre-aggregated stats for dashboard performance
-- Refresh every 5 minutes
-- =============================================

CREATE MATERIALIZED VIEW campaign_stats AS
SELECT 
  campaign_id,
  
  -- Counts
  COUNT(*) as total_visits,
  COUNT(*) FILTER (WHERE is_bot = true) as bot_visits,
  COUNT(*) FILTER (WHERE is_bot = false) as real_visits,
  
  -- Rates
  ROUND(
    (COUNT(*) FILTER (WHERE is_bot = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as cloaking_rate,
  
  -- Clicks (CTR)
  (SELECT COUNT(*) FROM click_logs WHERE click_logs.campaign_id = visit_logs.campaign_id) as total_clicks,
  
  ROUND(
    ((SELECT COUNT(*) FROM click_logs WHERE click_logs.campaign_id = visit_logs.campaign_id)::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE is_bot = false), 0)) * 100,
    2
  ) as ctr,
  
  -- Time Windows
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as visits_24h,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as visits_7d,
  
  -- Last Activity
  MAX(timestamp) as last_visit,
  NOW() as last_updated
  
FROM visit_logs
GROUP BY campaign_id;

-- Index on materialized view
CREATE UNIQUE INDEX idx_campaign_stats_campaign ON campaign_stats(campaign_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to refresh campaign stats
CREATE OR REPLACE FUNCTION refresh_campaign_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTOMATIC CLEANUP (Data Retention)
-- Delete logs older than 90 days
-- Runs daily
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM visit_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Orphaned click logs cleaned by CASCADE
  
  -- Refresh stats after cleanup
  PERFORM refresh_campaign_stats();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-logs', '0 3 * * *', 'SELECT cleanup_old_logs()');

-- =============================================
-- COMMENTS (Documentation)
-- =============================================

COMMENT ON TABLE visit_logs IS 'High-volume append-only log of all visits with bot detection results';
COMMENT ON COLUMN visit_logs.ip_hash IS 'SHA256 hash of IP for GDPR compliance (not reversible)';
COMMENT ON COLUMN visit_logs.probability IS 'Bot probability 0.0-1.0 from probabilistic scoring system';
COMMENT ON COLUMN visit_logs.detection_details IS 'JSONB with detailed scores per detection method';

COMMENT ON TABLE click_logs IS 'Tracks actual CTA clicks for CTR calculation';
COMMENT ON TABLE campaign_stats IS 'Pre-aggregated campaign statistics, refreshed every 5min';

-- =============================================
-- SAMPLE QUERY: Get Campaign Performance
-- =============================================

-- SELECT 
--   campaign_id,
--   total_visits,
--   bot_visits,
--   real_visits,
--   cloaking_rate || '%' as cloaking_rate,
--   total_clicks,
--   ctr || '%' as ctr
-- FROM campaign_stats
-- WHERE campaign_id = 'abc123'
-- LIMIT 1;

-- =============================================
-- SAMPLE QUERY: Recent Visits with Details
-- =============================================

-- SELECT 
--   id,
--   timestamp,
--   is_bot,
--   confidence,
--   page_served,
--   detection_details->referer'->>'reasons' as referer_reasons
-- FROM visit_logs
-- WHERE campaign_id = 'abc123'
-- ORDER BY timestamp DESC
-- LIMIT 100;
