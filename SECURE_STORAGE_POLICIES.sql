-- =====================================================
-- SECURE STORAGE POLICIES (SUPABASE)
-- =====================================================

-- This script secures the 'products' and 'product-images' buckets.
-- It ensures only authorized users can upload/delete images.

-- 1. Note: Row Level Security is usually enabled by default for Storage. 
-- You just need to define the policies.

-- 2. PRODUCTS BUCKET
-- SELECT: Public can view images
DROP POLICY IF EXISTS "Public View Products" ON storage.objects;
CREATE POLICY "Public View Products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products' OR bucket_id = 'product-images');

-- INSERT: Only authenticated users can upload
DROP POLICY IF EXISTS "Auth Uploads" ON storage.objects;
CREATE POLICY "Auth Uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    (bucket_id = 'products' OR bucket_id = 'product-images')
    AND auth.role() = 'authenticated'
  );

-- DELETE/UPDATE: Only the owner (based on folder/metadata) or an admin
-- Note: Supabase Storage owner is tracked via owner column (UUID of auth.uid())
DROP POLICY IF EXISTS "Owner Manage Storage" ON storage.objects;
CREATE POLICY "Owner Manage Storage" ON storage.objects
  FOR ALL USING (
    (bucket_id = 'products' OR bucket_id = 'product-images')
    AND (
      auth.uid() = owner
      OR EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid())
    )
  );
