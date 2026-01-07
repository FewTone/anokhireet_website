# Complete Database Analysis & Flow Explanation

## 📊 Database Schema Overview

### Table Hierarchy & Relationships

```
┌─────────────┐
│   admins    │ (Admin authentication)
└──────┬──────┘
       │
       │ (auth_user_id → Supabase Auth)
       │
┌──────▼──────┐         ┌──────────────┐
│    users    │◄────────┤  products    │
│             │         │              │
│ - id        │         │ - owner_user │
│ - phone     │         │   _id        │
│ - name      │         │ - title      │
│ - role      │         │ - price_per  │
│ - auth_user │         │   _day       │
│   _id       │         └──────┬───────┘
└──────┬──────┘                │
       │                       │
       │                       │ (product_id)
       │                       │
       │              ┌────────▼────────┐
       │              │   inquiries     │
       │              │                 │
       │              │ - product_id    │
       │              │ - owner_user_id │
       │              │ - renter_user_id│
       └──────────────┼─────────────────┘
                      │
                      │ (inquiry_id)
                      │
              ┌───────▼───────┐
              │     chats     │
              │               │
              │ - inquiry_id  │
              └───────┬───────┘
                      │
                      │ (chat_id)
                      │
              ┌───────▼───────┐
              │   messages    │
              │               │
              │ - chat_id     │
              │ - sender_user │
              │   _id         │
              └───────────────┘

┌──────────────┐      ┌─────────────────┐
│  categories  │◄─────┤   products      │
│              │      │                 │
│ - id         │      │ - category_id   │
│ - name       │      └─────────────────┘
│ - image_url  │
│ - is_featured│
└──────────────┘

┌──────────────────┐
│ website_settings │ (Independent)
│                  │
│ - key            │
│ - value (JSONB)  │
└──────────────────┘
```

---

## 📋 Table Details

### 1. **admins** (1 record)
**Purpose:** Stores admin users who can manage the platform

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique admin record ID |
| `auth_user_id` | UUID | NOT NULL, UNIQUE | Links to Supabase Auth user ID |
| `email` | TEXT | NOT NULL, UNIQUE | Admin email address |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |

**RLS Policies:**
- `admin read own` - Admins can read their own record

**Key Points:**
- Admins authenticate via Supabase Auth (email/password)
- Admin status determined by existence in this table
- Used for all admin authorization checks

---

### 2. **users** (1 record currently)
**Purpose:** Stores regular users (product owners and renters)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique user ID |
| `phone` | TEXT | NOT NULL, UNIQUE | User phone number (required, unique) |
| `name` | TEXT | NULLABLE | User's name |
| `role` | TEXT | CHECK: 'owner' or 'renter' | User role in system |
| `auth_user_id` | UUID | NULLABLE, UNIQUE | Links to Supabase Auth user ID (after OTP verification) |
| `email` | TEXT | NULLABLE | User's email (optional) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |

**RLS Policies:**
- `user read self` - Users can read their own profile
- `user create self profile` - Users can create their own profile when authenticating
- `admin manage users` - Admins have full access to all users

**Key Points:**
- Phone number is the primary identifier (required, unique)
- `auth_user_id` is set after OTP verification
- Users can be 'owner' or 'renter' (or both conceptually)

---

### 3. **categories** (2 records currently)
**Purpose:** Product categories for organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique category ID |
| `name` | TEXT | NOT NULL, UNIQUE | Category name |
| `image_url` | TEXT | NULLABLE | Category image URL |
| `link_url` | TEXT | NULLABLE | Category page URL |
| `display_order` | INTEGER | DEFAULT 0 | Display order in UI |
| `is_featured` | BOOLEAN | DEFAULT false | Whether category is featured |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**RLS Policies:**
- `public read categories` - Anyone can read categories
- `admin manage categories` - Only admins can create/update/delete

**Key Points:**
- Publicly readable (no auth needed)
- Only admins can modify

---

### 4. **products** (0 records currently)
**Purpose:** Stores rental products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique product ID |
| `owner_user_id` | UUID | NOT NULL, FK → users.id | Product owner (required) |
| `category_id` | UUID | NULLABLE, FK → categories.id | Product category |
| `title` | TEXT | NOT NULL | Product title (required) |
| `description` | TEXT | NULLABLE | Product description |
| `price_per_day` | NUMERIC | NULLABLE | Rental price per day |
| `is_active` | BOOLEAN | DEFAULT true | Whether product is active/visible |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| **Legacy columns (for compatibility):** | | | |
| `name` | TEXT | NULLABLE | Legacy: product name |
| `price` | TEXT | NULLABLE | Legacy: price as text |
| `image` | TEXT | NULLABLE | Legacy: product image URL |
| `product_id` | TEXT | NULLABLE | Legacy: external product ID |

**Foreign Keys:**
- `owner_user_id` → `users.id` (ON DELETE CASCADE)
- `category_id` → `categories.id`

**RLS Policies:**
- `public read products` - Anyone can read active products (`is_active = true`)
- `owner read products` - Product owners can read their own products (even if inactive)
- `admin manage products` - Admins have full access (create/read/update/delete)

**Key Points:**
- Products must have an owner (`owner_user_id` required)
- Only active products are visible to public
- Admins can see and manage all products
- Legacy columns maintained for backward compatibility

---

### 5. **inquiries** (0 records currently)
**Purpose:** Rental inquiries from renters to owners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique inquiry ID |
| `product_id` | UUID | NOT NULL, FK → products.id | Product being inquired about |
| `owner_user_id` | UUID | NOT NULL, FK → users.id | Product owner |
| `renter_user_id` | UUID | NOT NULL, FK → users.id | User making inquiry |
| `start_date` | DATE | NOT NULL | Rental start date |
| `end_date` | DATE | NOT NULL | Rental end date |
| `status` | TEXT | DEFAULT 'pending', CHECK: 'pending' or 'closed' | Inquiry status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Foreign Keys:**
- `product_id` → `products.id` (ON DELETE CASCADE)
- `owner_user_id` → `users.id`
- `renter_user_id` → `users.id`

**RLS Policies:**
- `users read own inquiries` - Users can read inquiries they own or made
- `renter create inquiry` - Renters can create inquiries for themselves
- `admin manage inquiries` - Admins have full access

**Key Points:**
- Links renter to owner via a product
- One inquiry per rental request
- Status tracks if inquiry is pending or closed

---

### 6. **chats** (0 records currently)
**Purpose:** Chat rooms for inquiry discussions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique chat ID |
| `inquiry_id` | UUID | NOT NULL, UNIQUE, FK → inquiries.id | Associated inquiry (one chat per inquiry) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Foreign Keys:**
- `inquiry_id` → `inquiries.id` (ON DELETE CASCADE)

**RLS Policies:**
- `chat participants read` - Only inquiry participants can read their chat

**Key Points:**
- One-to-one relationship with inquiries
- Created when inquiry is made
- Only owner and renter can access

---

### 7. **messages** (0 records currently)
**Purpose:** Individual messages within chats

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique message ID |
| `chat_id` | UUID | NOT NULL, FK → chats.id | Chat this message belongs to |
| `sender_user_id` | UUID | NOT NULL, FK → users.id | Message sender |
| `message` | TEXT | NOT NULL | Message content (text only) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |

**Foreign Keys:**
- `chat_id` → `chats.id` (ON DELETE CASCADE)
- `sender_user_id` → `users.id`

**RLS Policies:**
- `read messages` - Users can read messages in chats they participate in
- `send message` - Users can send messages if they're part of the chat

**Key Points:**
- Text-only messages
- Only chat participants can read/send
- Automatically deleted if chat/inquiry is deleted (CASCADE)

---

### 8. **website_settings** (1 record currently)
**Purpose:** Global website configuration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique setting ID |
| `key` | TEXT | NOT NULL, UNIQUE | Setting key (e.g., 'website_enabled') |
| `value` | JSONB | NULLABLE | Setting value (flexible JSON structure) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**RLS Policies:**
- `public read website settings` - Anyone can read settings
- `admin manage website settings` - Only admins can modify

**Key Points:**
- Key-value store with JSONB values
- Publicly readable for frontend configuration
- Only admins can update

---

## 🔄 Complete Application Flow

### Flow 1: Admin Authentication & Product Management

```
1. Admin Login
   ├─ User goes to /admin
   ├─ Enters email + password
   ├─ Supabase Auth authenticates
   └─ System checks admins table for auth_user_id match
   
2. Admin Creates Product
   ├─ Admin navigates to /admin/manage-products/[userId]
   ├─ Selects user (owner) from list
   ├─ Fills product form (title, price, category, images)
   ├─ System validates:
   │   ├─ Admin is authenticated (checks admins table)
   │   ├─ Owner user exists (foreign key check)
   │   └─ Required fields present (title, owner_user_id)
   ├─ Insert into products table
   │   ├─ owner_user_id = selected user's ID
   │   ├─ title = product name
   │   ├─ price_per_day = rental price
   │   ├─ category_id = selected category
   │   └─ is_active = true
   └─ Product visible on homepage and user's product list
```

**RLS Check for Product Insert:**
```sql
-- Policy: "admin manage products"
WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
)
```
✅ **This policy allows insert if admin is authenticated**

---

### Flow 2: User Registration & Authentication

```
1. User Visits /profile
   ├─ Enters phone number
   └─ Clicks "Send OTP"
   
2. OTP Verification (Current: Bypass with "000000")
   ├─ User enters OTP: "000000"
   ├─ System creates Supabase Auth session
   │   ├─ Creates Auth user with phone
   │   └─ Returns auth_user_id (UUID)
   ├─ System checks if user exists in users table
   │   ├─ If exists: Updates auth_user_id
   │   └─ If new: Creates user record
   │       ├─ Uses RLS policy: "user create self profile"
   │       └─ Sets auth_user_id = auth.uid()
   └─ User redirected to /user or /my-products
```

**RLS Check for User Creation:**
```sql
-- Policy: "user create self profile"
WITH CHECK (auth_user_id = auth.uid())
```
✅ **This allows user to create their own profile with matching auth_user_id**

---

### Flow 3: Product Viewing & Inquiry

```
1. Public Browsing
   ├─ Anyone visits homepage (/)
   ├─ System queries products table
   │   └─ WHERE is_active = true (public read policy)
   └─ Displays all active products

2. User Makes Inquiry
   ├─ User (renter) finds product they want
   ├─ Fills inquiry form (start_date, end_date)
   ├─ System creates inquiry:
   │   ├─ product_id = selected product
   │   ├─ renter_user_id = current user's ID
   │   ├─ owner_user_id = product's owner_user_id
   │   ├─ start_date, end_date from form
   │   └─ status = 'pending'
   ├─ System creates chat automatically
   │   └─ inquiry_id = new inquiry ID
   └─ Both owner and renter can now chat
```

**RLS Check for Inquiry Creation:**
```sql
-- Policy: "renter create inquiry"
WITH CHECK (
  renter_user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
)
```
✅ **Only authenticated users can create inquiries for themselves**

---

### Flow 4: Chat & Messaging

```
1. Viewing Chats
   ├─ User navigates to their inquiries
   ├─ System queries chats table
   │   └─ JOIN with inquiries to filter by participant
   └─ Shows all chats user is involved in

2. Sending Messages
   ├─ User opens a chat
   ├─ Types message
   ├─ System inserts into messages:
   │   ├─ chat_id = current chat
   │   ├─ sender_user_id = current user's ID
   │   └─ message = message text
   └─ Message visible to both participants
```

**RLS Check for Messages:**
```sql
-- Policy: "send message"
WITH CHECK (
  sender_user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
)
```
✅ **Users can only send messages as themselves**

---

### Flow 5: Category Management

```
1. Admin Views Categories
   ├─ Public can view (no auth needed)
   └─ Displayed on homepage/category pages

2. Admin Creates Category
   ├─ Admin goes to category management
   ├─ Enters category name, image, etc.
   ├─ System inserts into categories
   └─ Category appears in UI immediately
```

**RLS Check for Categories:**
```sql
-- Policy: "public read categories"
USING (true)
```
✅ **Anyone can read categories**

```sql
-- Policy: "admin manage categories"
USING (
  EXISTS (SELECT 1 FROM admins WHERE auth_user_id = auth.uid())
)
```
✅ **Only admins can create/update/delete**

---

## 🔐 Security Model (RLS Policies)

### Authentication Flow
1. **Supabase Auth** handles login (email/password for admin, OTP for users)
2. **auth.uid()** function returns current authenticated user's UUID
3. **RLS policies** check permissions using `auth.uid()`

### Authorization Levels

#### **Public (No Auth Required)**
- Read products (`is_active = true`)
- Read categories
- Read website settings

#### **Authenticated Users**
- Read own profile
- Create own profile (on first login)
- Read own products
- Create inquiries
- Read own inquiries
- Read/send messages in their chats

#### **Admins**
- Full access to all tables
- Can manage users, products, categories, inquiries
- Can update website settings

---

## 🎯 Key Relationships

### Users → Products
- **One-to-Many**: One user can own many products
- **Foreign Key**: `products.owner_user_id` → `users.id`
- **Cascade**: If user deleted, products deleted

### Products → Categories
- **Many-to-One**: Many products can belong to one category
- **Foreign Key**: `products.category_id` → `categories.id`

### Products → Inquiries
- **One-to-Many**: One product can have many inquiries
- **Foreign Key**: `inquiries.product_id` → `products.id`
- **Cascade**: If product deleted, inquiries deleted

### Inquiries → Chats
- **One-to-One**: Each inquiry has exactly one chat
- **Foreign Key**: `chats.inquiry_id` → `inquiries.id` (UNIQUE)
- **Cascade**: If inquiry deleted, chat deleted

### Chats → Messages
- **One-to-Many**: One chat can have many messages
- **Foreign Key**: `messages.chat_id` → `chats.id`
- **Cascade**: If chat deleted, messages deleted

---

## ⚠️ Current Issue Analysis

### Problem: Empty Error `{}` When Creating Product

**Root Cause Analysis:**

1. **RLS Policy is Correct** ✅
   - `admin manage products` has proper `WITH CHECK` clause
   - Should allow admin inserts

2. **Possible Issues:**

   **a) Foreign Key Constraint**
   - `owner_user_id` must exist in `users` table
   - If `userId` from URL doesn't match any user → Insert fails
   - **Solution**: Validate `userId` exists before insert

   **b) Admin Session Not Authenticated**
   - If `auth.uid()` is null or doesn't match admins table → Policy fails
   - **Solution**: Verify admin session before insert (already added)

   **c) Empty Error Object**
   - Supabase sometimes returns `{}` for constraint violations
   - **Solution**: Better error logging (already added)

3. **Most Likely Issue:**
   - **Foreign Key Violation**: The `userId` parameter from the URL doesn't exist in the `users` table
   - Database rejects insert silently with empty error

**Recommended Fix:**
```typescript
// Before insert, verify user exists
const { data: userExists } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

if (!userExists) {
    throw new Error(`User ${userId} does not exist`);
}
```

---

## 📊 Current Data Summary

- **Admins**: 1
- **Users**: 1
- **Categories**: 2
- **Products**: 0
- **Inquiries**: 0
- **Chats**: 0
- **Messages**: 0
- **Website Settings**: 1

---

## 🚀 Next Steps

1. **Fix Product Insert Issue**
   - Add user existence validation
   - Improve error messages
   - Verify admin authentication flow

2. **Test Complete Flow**
   - Admin creates product → Verify it appears
   - User browses products → Verify public access
   - User creates inquiry → Verify chat creation
   - Users chat → Verify message permissions

3. **Monitor RLS Policies**
   - Ensure all policies have proper `WITH CHECK` clauses
   - Test each policy with different user roles
   - Verify cascade deletions work correctly

