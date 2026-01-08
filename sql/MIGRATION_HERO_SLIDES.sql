-- =====================================================
-- HERO SLIDES TABLE - For Dynamic Hero Section
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read active slides
DROP POLICY IF EXISTS "public read hero slides" ON hero_slides;
CREATE POLICY "public read hero slides" ON hero_slides
  FOR SELECT
  USING (is_active = true);

-- Admin full access
DROP POLICY IF EXISTS "admin manage hero slides" ON hero_slides;
CREATE POLICY "admin manage hero slides" ON hero_slides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE auth_user_id = auth.uid()
    )
  );

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_hero_slides_display_order ON hero_slides(display_order, is_active);

-- Insert default slides (migrate from existing data)
INSERT INTO hero_slides (image_url, title, subtitle, display_order, is_active)
VALUES
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/82e7eae2-d230-4c96-a0c1-2f2571a7b39d/1763450575.jpeg?w=90', 'WINTER WEAR', 'COMFORTABLE, COZY AND CONFIDENT', 0, true),
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/08b2b979-41bf-470f-bfd9-a1b727705031/1765536303.jpeg?w=90', 'T-SHIRTS', 'HOLIDAY SEASON FAVES', 1, true),
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/6b192e4d-d75c-4033-99d3-fe9f60eeb016/1763450777.jpeg?w=90', 'TECHN WEAR', 'INNOVATION IN EVERY THREAD', 2, true),
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/cb59bd61-d119-4d5b-a9d5-efcc2f9eeb85/1763450610.jpeg?w=90', 'NEW ARRIVALS', 'FRESH DROPS DAILY', 3, true),
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/43a89432-c632-421b-ab08-099869b84fce/1765536762.jpeg?w=90', 'BEST SELLERS', 'TRENDING NOW', 4, true),
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/c0ea1377-b098-4d54-9b02-a1f500b33400/1763450637.jpeg?w=90', 'OVERSIZED', 'STREET STYLE STAPLES', 5, true),
  ('https://d2d5n4ft74bagm.cloudfront.net/media/banners/08b2b979-41bf-470f-bfd9-a1b727705031/1763450928.jpeg?w=90', 'ACCESSORIES', 'COMPLETE YOUR LOOK', 6, true)
ON CONFLICT DO NOTHING;


