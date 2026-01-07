-- Create Storage Bucket for Product Images
-- Note: Storage buckets cannot be created via SQL directly
-- This file contains instructions and policies that can be applied after creating the bucket via Dashboard

-- After creating the bucket 'product-images' in Supabase Dashboard → Storage,
-- run these policies in SQL Editor:

-- Policy 1: Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated uploads (only logged-in users can upload)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated updates (for editing products)
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated deletes (for deleting products)
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);




