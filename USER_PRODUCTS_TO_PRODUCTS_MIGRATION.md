# Migration: user_products → products

## Schema Changes

- **Table:** `user_products` → `products`
- **Column:** `user_id` → `owner_user_id`
- **Column:** `name` → `title` (but `name` kept for compatibility)
- **Column:** `price` → `price_per_day` (but `price` kept for compatibility)

## Files Updated

✅ `src/app/admin/page.tsx` - Updated to use `products` table

## Files Still Need Updates

The following files still reference `user_products` and need to be updated:

1. `src/app/my-products/page.tsx`
2. `src/app/admin/manage-products/[userId]/page.tsx`
3. `src/app/page.tsx`
4. `src/app/shirt-collection/page.tsx`
5. `src/app/[category]/page.tsx`
6. `src/app/products/[id]/page.tsx`

## Quick Fix Pattern

Replace:
```typescript
.from("user_products")
.select("*")
.eq("user_id", userId)
```

With:
```typescript
.from("products")
.select("*")
.eq("owner_user_id", userId)
```

And map the results:
```typescript
const mappedProducts = data.map((p: any) => ({
    id: p.id,
    user_id: p.owner_user_id,
    name: p.title || p.name,
    price: p.price || p.price_per_day?.toString() || "",
    image: p.image || "",
    product_id: p.product_id,
    created_at: p.created_at,
}));
```

