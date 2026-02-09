# Anokhi Reet: Admin & Website System Overview

This document provides a detailed technical breakdown of how the Admin Dashboard and Website are built, how they connect, and their core functionalities. This is intended to help developers or AI assistants understand the system architecture.

## 1. Project Restructure (Monorepo)
To support a subdomain-based deployment (e.g., `admin.anokhireet.com`), the project has been restructured into a monorepo using **npm workspaces**.

- **`apps/website`**: The main customer-facing storefront.
- **`apps/admin`**: The internal administration dashboard.
- **`packages/shared`**: Common logic, Supabase client configuration, shared hooks, and types used by both apps.

### Subdomain Connectivity
The separation allows each app to be built and deployed independently. The shared logic ensures that both apps point to the same database and storage buckets, maintaining data consistency.

---

## 2. Technology Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS.
- **Backend/Database**: Supabase (PostgreSQL, Realtime, Storage, Auth).
- **Styling**: Vanilla CSS & Tailwind.
- **Deployment Strategy**: Standalone apps for Website (Main Domain) and Admin (Subdomain).

---

## 3. Admin Authentication & Setup
The admin dashboard uses a secure, two-layer authentication system:

1.  **Supabase Auth**: Standard email/password login.
2.  **`admins` Table Restriction**: Even if a user logs in via Supabase, they must have an entry in the `admins` table in the database to access the dashboard.
3.  **Setup Script**: Admin users were initially set up using `SETUP_ADMIN_USER.sql`, which inserts the user into the `admins` table after they sign up.

---

## 4. Admin Functionality
The Admin Dashboard (`apps/admin`) is the brain of the operation. Key modules include:

### Product Management
- **Add/Edit Products**: Detailed forms for product metadata (Name, Price, Category, etc.).
- **Image Handling**: Supports multiple image uploads, primary image selection, and automatic WebP conversion for performance.
- **Listing Status**: Admins can set products to `Pending`, `Approved`, or `Rejected`. Only approved products appear on the website.

### Facet & Taxonomy Management
- **Categories/Types**: Manage the product categorization system.
- **Occasions/Materials/Colors**: Centralized control over search filters (facets) used on the website.
- **City Management**: Control over location-based listing features.

### Website Controls
- **Website Guard**: A master switch in the Admin Panel can enable "Coming Soon" mode for the entire website by toggling a value in the `website_settings` table.
- **Hero Slider**: Manage the images and text on the main website's landing page.
- **Poster Management**: Update promotional posters/banners dynamically.

### User & Communication
- **Contact Requests**: View and manage inquiries from the website's contact form.
- **User Reports**: Oversee reports made against specific products or users.

---

## 5. Website Functionality (`apps/website`)
The main storefront interacts with the data managed by the admin.

- **Dynamic Filtering**: Uses the facets (colors, materials, etc.) managed in the admin panel.
- **Website Guarding**: Checks the `website_settings` table on every load to decide whether to show the site or the coming-soon page.
- **User Products**: Allows users to upload their own products for review, which then appear in the Admin Dashboard for approval.

---

## 6. Database Connection
Both applications connect to the same **Supabase** instance.

- **Shared Client**: Located in `packages/shared/src/lib/supabase.ts`.
- **Realtime**: Used for immediate updates when admin settings (like the Website Guard) are changed.
- **RLS Policies**: Row-Level Security ensures that public users can only read approved products, while admins have full CRUD access.

---

## 7. Logic Flow: Product Lifecycle
1.  **Submission**: User submits a product in `apps/website`.
2.  **Pending**: Product appears in `apps/admin` under "Manage Products" with a `Pending` status.
3.  **Review**: Admin reviews images, price, and metadata.
4.  **Approval**: Admin changes status to `Approved`.
5.  **Visibility**: The product immediately appears on the `apps/website` shop pages.
