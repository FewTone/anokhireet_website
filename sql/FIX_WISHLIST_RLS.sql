-- =====================================================
-- FIX WISHLIST RLS POLICIES
-- Run this in Supabase SQL Editor to fix the "Like Count" issue
-- =====================================================

-- 1. Ensure RLS is enabled on wishlist table
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts and clean up
DROP POLICY IF EXISTS "Users can view own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlist;
DROP POLICY IF EXISTS "Product owners can view wishlist items" ON wishlist;
-- Drop any generic policies that might exist
DROP POLICY IF EXISTS "Enable read access for all users" ON wishlist;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON wishlist;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON wishlist;

-- 3. Create comprehensive policies

-- Policy 1: Users can view their own wishlist items (Standard)
CREATE POLICY "Users can view own wishlist items"
ON wishlist FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Product owners can view wishlist items for THEIR products (The Fix)
-- This allows the seller to count how many people liked their product
CREATE POLICY "Product owners can view wishlist items"
ON wishlist FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = wishlist.product_id
    AND products.owner_user_id = auth.uid()
  )
);

-- Policy 3: Users can add items to their wishlist
CREATE POLICY "Users can insert own wishlist items"
ON wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can remove items from their wishlist
CREATE POLICY "Users can delete own wishlist items"
ON wishlist FOR DELETE
USING (auth.uid() = user_id);

-- 4. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'wishlist';
