-- =====================================================
-- ADD WEBSITE_SETTINGS TABLE
-- Run this in Supabase SQL Editor if you already ran CLEAN_MIGRATION.sql
-- =====================================================

-- Create website_settings table
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "public read website settings" ON website_settings;
DROP POLICY IF EXISTS "admin manage website settings" ON website_settings;

-- Public can read website settings
CREATE POLICY "public read website settings"
ON website_settings FOR SELECT
USING (true);

-- Admin can manage website settings
CREATE POLICY "admin manage website settings"
ON website_settings FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_website_settings_key ON website_settings(key);

-- Verify
SELECT '✅ Website settings table created!' as status;

