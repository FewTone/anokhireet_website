-- Fix RLS policy for products table to allow admin inserts
-- The policy needs a WITH CHECK clause for INSERT operations

DROP POLICY IF EXISTS "admin manage products" ON products;

CREATE POLICY "admin manage products"
ON products FOR ALL
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
);

