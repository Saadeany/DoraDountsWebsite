# Felt & Form — Full-Stack E-Commerce(V4)

> Heavyweight basics and considered silhouettes, designed in Cairo.  
> A production-ready clothing brand e-commerce platform built with **React + Vite**, **Node.js / Express**, and **MySQL**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Running the App](#running-the-app)
8. [Seed Data](#seed-data)
9. [Default Accounts](#default-accounts)
10. [API Endpoints](#api-endpoints)
11. [Admin Panel](#admin-panel)
12. [Security Features](#security-features)
13. [Switching to Cloudinary](#switching-to-cloudinary)
14. [Deployment Notes](#deployment-notes)

---

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 18, Vite 5, Tailwind CSS 3, Framer Motion, React Router DOM 6 |
| Backend     | Node.js, Express 4 |
| Database    | MySQL 8.0 + Sequelize 6 ORM |
| Auth        | JWT (jsonwebtoken) + bcryptjs |
| Uploads     | Multer v2 — local disk (swap to Cloudinary with one config change) |
| Security    | helmet, cors, express-rate-limit, xss |

---

## Project Structure

```
felt-and-form/
├── backend/
│   ├── config/          # Sequelize DB connection
│   ├── controllers/     # Route handler logic
│   ├── middleware/       # auth, upload, sanitize, error handler
│   ├── models/          # Sequelize models + associations
│   ├── routes/          # Express routers
│   ├── uploads/         # Saved product/category/profile images
│   ├── utils/           # Token generator, order number, placeholder SVG
│   ├── seed.js          # Seeds all tables with 33 products
│   ├── server.js        # Express entry point
│   ├── .env.example     # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios wrappers per resource
│   │   ├── components/  # layout/, product/, common/
│   │   ├── context/     # Auth, Cart, Wishlist contexts
│   │   ├── pages/       # All public pages + admin/ sub-folder
│   │   └── utils/       # format.js helpers
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── database/
    └── schema.sql       # Raw SQL reference (optional manual import)
```

---

## Prerequisites

- **Node.js** ≥ 18  
- **npm** ≥ 9  
- **MySQL** 8.0 (local or remote)  
- A terminal — that's all.

---

## Quick Start

### 1 — Clone / download

```bash
git clone https://github.com/your-org/felt-and-form.git
cd felt-and-form
```

### 2 — Create the MySQL database and user

```sql
-- run this in the MySQL shell as root
CREATE DATABASE felt_and_form CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'felt_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'felt_password_123';
GRANT ALL PRIVILEGES ON felt_and_form.* TO 'felt_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3 — Configure the backend

```bash
cd backend
cp .env.example .env
# Open .env and verify DB credentials match what you created above.
# Change JWT_SECRET to a long random string before deploying.
```

### 4 — Install dependencies

```bash
# From the backend folder:
npm install

# From the frontend folder:
cd ../frontend
npm install
```

### 5 — Seed the database

```bash
cd ../backend
npm run seed
```

This command:
- Runs `sequelize.sync({ force: true })` — creates all tables fresh
- Inserts 7 categories, 10 colours, 7 sizes, **33 products** with placeholder images
- Creates an admin and a demo customer account
- Creates two ready-to-use coupons (`WELCOME10`, `FORM20`)
- Seeds one sample delivered order with a review

### 6 — Start both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev        # uses nodemon, auto-restarts on changes
# or: npm start   (no auto-restart)
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

All variables live in `backend/.env`. Copy from `.env.example` and fill in:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Express listen port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CLIENT_URL` | Frontend origin (for CORS) | `http://localhost:5173` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `felt_and_form` |
| `DB_USER` | MySQL user | `felt_user` |
| `DB_PASSWORD` | MySQL password | `felt_password_123` |
| `JWT_SECRET` | **Change this before deploying** | _(placeholder)_ |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `MAX_FILE_SIZE_MB` | Max upload size | `5` |
| `SEED_ADMIN_EMAIL` | Admin email created by seed | `admin@feltandform.com` |
| `SEED_ADMIN_PASSWORD` | Admin password created by seed | `Admin@12345` |

---

## Database Setup

The seed script creates every table via Sequelize's `sync({ force: true })`.  
To do it manually instead, import the reference file:

```bash
mysql -u felt_user -p felt_and_form < database/schema.sql
```

Then run the seed to populate data:

```bash
cd backend && npm run seed
```

---

## Running the App

| Command | What it does |
|---------|-------------|
| `cd backend && npm run dev` | Start API with nodemon hot-reload |
| `cd backend && npm start` | Start API (production-style, no reload) |
| `cd backend && npm run seed` | Drop all tables, recreate, populate |
| `cd frontend && npm run dev` | Start Vite dev server (port 5173) |
| `cd frontend && npm run build` | Production bundle → `frontend/dist/` |
| `cd frontend && npm run preview` | Preview the production build locally |

---

## Seed Data

After running `npm run seed`, the database contains:

| Entity | Count |
|--------|-------|
| Categories | 7 (Men, Women, T-Shirts, Hoodies, Pants, Oversized, Accessories) |
| Products | 33 across all categories, priced in EGP |
| Sizes | 7 (XS → XXL, One Size) |
| Colours | 10 (Black, White, Beige, Grey, Charcoal, Navy, Olive, Brown, Cream, Stone) |
| Coupons | 2 (WELCOME10 = 10%, FORM20 = 20%) |
| Users | 1 admin + 1 demo customer |

Product images are generated as branded SVG placeholders. Replace them with real photography by uploading through the admin panel (`/admin/products`).

---

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@feltandform.com | Admin@12345 |
| Customer | customer@feltandform.com | Customer@123 |

Change passwords immediately after deploying to production.

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create customer account |
| POST | `/auth/login` | — | Login (returns JWT + role) |
| GET | `/auth/me` | ✓ | Get current user |
| PUT | `/auth/profile` | ✓ | Update name / phone / avatar |
| PUT | `/auth/change-password` | ✓ | Change password |
| PUT | `/auth/addresses` | ✓ | Save address list |

### Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | — | List with filters: `search`, `category`, `gender`, `tag`, `min_price`, `max_price`, `size`, `color`, `sort`, `page`, `limit` |
| GET | `/products/search-suggestions?q=` | — | Instant search suggestions |
| GET | `/products/:slug` | — | Product detail + reviews + similar |

### Categories & Meta

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | All categories |
| GET | `/meta/filters` | All sizes + colours (for filter UI) |

### Cart

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cart` | Current user's active cart |
| GET | `/cart/saved` | Saved-for-later items |
| POST | `/cart` | Add item (`product_id`, `size`, `color`, `quantity`) |
| PUT | `/cart/:id` | Update quantity |
| DELETE | `/cart/:id` | Remove item |
| PUT | `/cart/:id/save-for-later` | Toggle saved/active |

### Wishlist

| Method | Path | Description |
|--------|------|-------------|
| GET | `/wishlist` | Current user's wishlist |
| POST | `/wishlist` | Add product (`product_id`) |
| DELETE | `/wishlist/:productId` | Remove product |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| POST | `/orders/checkout` | Place order from cart (supports `coupon_code`) |
| GET | `/orders/my-orders` | Order history for current user |
| GET | `/orders/:id` | Single order detail |

### Coupons

| Method | Path | Description |
|--------|------|-------------|
| POST | `/coupons/validate` | Validate a coupon code before checkout |

### Reviews

| Method | Path | Description |
|--------|------|-------------|
| POST | `/reviews` | Submit review (must have a delivered order containing the product) |
| DELETE | `/reviews/:id` | Delete own review |

### Newsletter

| Method | Path | Description |
|--------|------|-------------|
| POST | `/newsletter/subscribe` | Subscribe email |

### Admin (all require `role: admin` JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard KPIs + monthly revenue |
| GET | `/admin/products` | Paginated product list (includes inactive) |
| POST | `/admin/products` | Create product (multipart, up to 8 images) |
| PUT | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product + disk images |
| DELETE | `/admin/products/:id/images/:imgId` | Remove single image |
| POST | `/admin/categories` | Create category |
| PUT | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Delete category |
| GET | `/admin/orders` | All orders (filterable by `status`) |
| GET | `/admin/orders/:id` | Single order detail |
| PUT | `/admin/orders/:id/status` | Update order status |
| GET | `/admin/users` | Customer list (searchable) |
| PUT | `/admin/users/:id/block` | Toggle block/unblock |
| DELETE | `/admin/users/:id` | Delete customer |
| GET | `/admin/coupons` | All coupons |
| POST | `/admin/coupons` | Create coupon |
| PUT | `/admin/coupons/:id` | Update coupon |
| DELETE | `/admin/coupons/:id` | Delete coupon |

---

## Admin Panel

Navigate to **http://localhost:5173/admin/login** (or `/admin/login` in production).

Login with admin credentials. The panel includes:

- **Dashboard** — KPI cards + monthly revenue bar chart
- **Products** — searchable table, add/edit/delete with multi-image upload
- **Categories** — add/edit/delete with image
- **Orders** — expandable rows, status filters, one-click status update with automatic stock restock on cancellation
- **Customers** — search, block/unblock, delete
- **Coupons** — full CRUD with date ranges and usage limits

---

## Security Features

- Passwords hashed with **bcrypt** (cost factor 12)
- JWT signed with a secret from env — role embedded in payload
- `helmet` sets HTTP security headers on every response
- Global rate limiter: 500 requests / 15 min per IP
- Auth endpoints rate-limited: 20 requests / 15 min per IP
- XSS sanitization middleware strips dangerous HTML from all request bodies (password fields deliberately excluded)
- SQL injection prevention via **Sequelize parameterised queries** — raw SQL is never interpolated
- Admin routes require `role: "admin"` in the JWT — middleware double-checks on every request
- Blocked users receive a 403 on every API call, even with a valid token
- File uploads: MIME type whitelist (JPEG, PNG, WEBP only), 5 MB limit, random filename to prevent path traversal

---

## Switching to Cloudinary

1. Install the SDK: `npm install cloudinary multer-storage-cloudinary`
2. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. Replace the `makeStorage` function in `backend/middleware/upload.js` with a `CloudinaryStorage` instance.
4. Update image URL references — Cloudinary returns full HTTPS URLs, so strip the `/uploads/` prefix from the frontend image paths.

---

## Deployment Notes

**Backend (e.g. Railway, Render, EC2):**
- Set all `.env` variables as platform secrets
- Change `JWT_SECRET` to a cryptographically random 64-char string
- Set `NODE_ENV=production`
- Run `node seed.js` once on the production DB, then **never again** (it drops all tables)

**Frontend (e.g. Vercel, Netlify):**
- Build command: `npm run build` (from `frontend/`)
- Output directory: `frontend/dist`
- Set `VITE_API_URL` if you move away from Vite's proxy to a direct backend URL

**Database:**
- Use a managed MySQL service (PlanetScale, AWS RDS, Digital Ocean Managed DB) in production
- Enable SSL on the Sequelize connection: add `dialectOptions: { ssl: { rejectUnauthorized: true } }` to `config/db.js`

---

## Email & Notification System

### SMTP Setup (required for emails to send)

1. Copy `.env.example` to `.env` (already done during Quick Start).
2. Fill in the `SMTP_*` variables with your provider credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password   # Gmail → Account → Security → App passwords
EMAIL_FROM_NAME=Felt & Form
EMAIL_FROM_ADDRESS=hello@feltandform.com
ADMIN_NOTIFY_EMAIL=admin@feltandform.com
```

> **Testing without real SMTP?** Use [Mailtrap](https://mailtrap.io) — a free inbox that
> catches all outgoing emails without delivering them. Set `SMTP_HOST=sandbox.smtp.mailtrap.io`
> and `SMTP_PORT=2525` with your Mailtrap credentials.

### Emails sent automatically

| Trigger | Recipient | Template |
|---------|-----------|----------|
| New registration | Customer | Welcome + Verify Email |
| New registration | Admin | New Customer alert |
| Email verification request | Customer | Verify Email link (expires in 30 min) |
| Forgot password | Customer | Password Reset link (expires in 15 min) |
| Order placed | Customer | Full order confirmation with line items |
| Order placed | Admin | New order alert with totals |
| Order status changed | Customer | Status-specific update (Processing / Shipped / Delivered / Cancelled) |
| Stock ≤ LOW_STOCK_THRESHOLD | Admin | Low stock alert |
| Contact form submitted | Admin | Customer message |

### Email verification flow

1. User registers → receives Welcome + Verify Email (token valid 30 min).
2. User clicks link → `GET /api/auth/verify-email?token=...` → `is_email_verified = true`.
3. Until verified, a dismissable banner appears at the top of every page.
4. Unverified users who try to place an order receive a `403` with `code: "EMAIL_NOT_VERIFIED"`.
5. Users can click **Resend link** in the banner at any time → `POST /api/auth/resend-verification`.

### Password reset flow

1. User visits `/forgot-password` → enters email → `POST /api/auth/forgot-password`.
2. Backend sends a reset link (token valid 15 min). Response is identical whether the
   email exists or not (prevents enumeration attacks).
3. User clicks link → `/reset-password?token=...` → enters new password → `POST /api/auth/reset-password`.
4. Token is marked used immediately; cannot be reused.

### In-app Notification Center

All users have a notification bell (🔔) in the navbar. Clicking it opens a dropdown showing
the last 50 notifications with unread counts, per-item mark-read, and clear-all.

Notifications poll automatically every 60 seconds for new items.

**Customer notification types:** order_confirmed, order_processing, order_shipped, order_delivered, order_cancelled, promo, coupon

**Admin notification types:** admin_new_order, admin_low_stock, admin_new_user, admin_contact

### Email Logs (Admin)

Navigate to `/admin/email-logs` to see every email the system has attempted to send:
type, recipient, subject, status (sent/failed), timestamp, and error message if failed.

### New API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/auth/verify-email?token=` | — | Verify email from link |
| POST | `/api/auth/resend-verification` | ✓ | Resend verification email |
| POST | `/api/auth/forgot-password` | — | Send password reset email |
| POST | `/api/auth/reset-password` | — | Reset password with token |
| GET  | `/api/notifications` | ✓ | Get user notifications + unread count |
| PUT  | `/api/notifications/mark-all-read` | ✓ | Mark all as read |
| PUT  | `/api/notifications/:id/read` | ✓ | Mark one as read |
| DELETE | `/api/notifications/:id` | ✓ | Delete one notification |
| DELETE | `/api/notifications` | ✓ | Clear all notifications |
| GET  | `/api/admin/email-logs` | admin | View email log |
| POST | `/api/contact` | — | Submit contact form (notifies admin) |

### New database tables

| Table | Purpose |
|-------|---------|
| `email_verification_tokens` | One-use tokens for email verification (expires in 30 min) |
| `password_reset_tokens` | One-use tokens for password reset (expires in 15 min) |
| `notifications` | In-app notifications for customers and admins |
| `email_logs` | Audit log of every email send attempt |

### New frontend pages

| Route | Page |
|-------|------|
| `/verify-email?token=` | Email verification landing page |
| `/forgot-password` | Request password reset email |
| `/reset-password?token=` | Set new password via reset link |
| `/admin/email-logs` | Admin email audit log |

