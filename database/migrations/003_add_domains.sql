-- =============================================
-- DOMAINS TABLE FOR MULTI-DOMAIN SUPPORT
-- Allows custom domains (e.g., oferta.com)
-- =============================================

CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                          -- For multi-tenant (optional)
  domain VARCHAR(255) UNIQUE NOT NULL,   -- e.g., "oferta.com"
  campaign_id VARCHAR(100),              -- Optional linked campaign
  
  -- Verification
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'failed')),
  verification_token VARCHAR(64) NOT NULL,
  verification_method VARCHAR(10) DEFAULT 'cname'
    CHECK (verification_method IN ('cname', 'txt')),
  verified_at TIMESTAMPTZ,
  
  -- SSL
  ssl_status VARCHAR(20) DEFAULT 'pending'
    CHECK (ssl_status IN ('pending', 'active', 'failed')),
  ssl_issued_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_campaign_id ON domains(campaign_id);
CREATE INDEX idx_domains_status ON domains(status);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_domains_updated_at
BEFORE UPDATE ON domains
FOR EACH ROW
EXECUTE FUNCTION update_domains_updated_at();

-- Comments
COMMENT ON TABLE domains IS 'Custom domains for campaigns (e.g., oferta.com)';
COMMENT ON COLUMN domains.verification_token IS 'Random token for DNS verification';
COMMENT ON COLUMN domains.status IS 'pending: awaiting verification, active: live, failed: verification failed';
