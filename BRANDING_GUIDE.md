# Rebranding Guide — How to Adapt This Store for Any Brand

This store was built to be reused. Every brand-specific value — name, colours, fonts, copy,
currency, location, payment methods — lives in a small number of clearly-labelled files.
Follow the steps below to launch a completely different brand without touching any business logic.

---

## Quick-reference: where everything lives

| What you want to change | File(s) | Time needed |
|-------------------------|---------|-------------|
| Brand name | 5 files | 5 min |
| Colours | 2 files | 5 min |
| Fonts | 2 files | 10 min |
| Currency & pricing | 2 files | 5 min |
| Logo | 1 file | 2 min |
| Contact info & location | 3 files | 5 min |
| Payment methods | 2 files | 10 min |
| Email sender name | 1 env var | 1 min |
| Email templates (colours/name) | 1 file | 5 min |
| Navigation links | 1 file | 5 min |
| Category list | seed.js | 10 min |
| Social media links | 1 file | 5 min |

---

## 1 — Brand name

### Backend — environment variable (the primary source of truth)

`backend/.env`
```
EMAIL_FROM_NAME=Your Brand Name
EMAIL_FROM_ADDRESS=hello@yourbrand.com
ADMIN_NOTIFY_EMAIL=admin@yourbrand.com
```

All nine email templates pull `process.env.EMAIL_FROM_NAME` automatically.

### Frontend — 5 locations

**`frontend/index.html`** (browser tab title + meta description)
```html
<title>Your Brand — Your Tagline</title>
<meta name="description" content="Your Brand: your tagline here." />
```

**`frontend/src/components/layout/Navbar.jsx`** (line ~22)
```jsx
<span className="font-display text-xl tracking-widest2">YOUR BRAND</span>
```

**`frontend/src/components/layout/Footer.jsx`** (line ~15 and footer copy)
```jsx
<h3 className="font-display text-2xl tracking-widest2">YOUR BRAND</h3>
// ...
<p>© {new Date().getFullYear()} Your Brand. All rights reserved.</p>
<p>Made in [Your City], [Your Country].</p>
```

**`frontend/src/pages/HomePage.jsx`** (hero section ~line 70)
```jsx
<h1 className="font-display text-6xl ...">
  YOUR<br />&amp;<br />BRAND
</h1>
<p>Your hero tagline here.</p>
```

**`frontend/src/pages/admin/AdminLayout.jsx`** (sidebar header)
```jsx
<p className="font-display text-lg tracking-widest2">YOUR BRAND</p>
```

**`frontend/src/pages/LoginPage.jsx`** and all auth pages:
```jsx
<h1 className="font-display text-4xl">YOUR BRAND</h1>
```

---

## 2 — Colours

The entire colour palette is defined in **two files** and flows everywhere else automatically.

### `frontend/tailwind.config.js`

```js
colors: {
  // ── Change these 6 values to rebrand the entire website ──
  ink:      "#1A1A1A",   // primary dark  (text, buttons, navbar bg)
  charcoal: "#2B2B2B",   // secondary dark (hover states, sidebar)
  stone:    "#A89F8E",   // muted accent   (labels, borders, eyebrows)
  beige:    "#D8C9AE",   // warm mid-tone  (category cards, accents)
  cream:    "#F4F1EA",   // light bg       (section alternates, inputs)
  paper:    "#FAF8F4",   // page bg        (body background, cards)
},
```

**Examples of complete rebrands using only these 6 values:**

```js
colors: {

  // ── Dora Donuts — Baby Blue & Pink ──

  ink:      "#2B2D42",   // primary dark (text, buttons, navbar bg)
  charcoal: "#3D405B",   // secondary dark (hover states, sidebar)
  stone:    "#A7B8C8",   // muted blue (labels, borders, eyebrows)
  beige:    "#F4B6C2",   // soft pink (category cards, accents)
  cream:    "#DCEEFF",   // baby blue (section alternates, inputs)
  paper:    "#FFF9FB",   // very light pink-white (page bg, cards)

},
// ── Minimal Black & White ─────────────────────────────────
ink:      "#000000",
charcoal: "#1A1A1A",
stone:    "#6B6B6B",
beige:    "#C8C8C8",
cream:    "#F0F0F0",
paper:    "#FAFAFA",

// ── Ocean Blue ────────────────────────────────────────────
ink:      "#0C2340",
charcoal: "#1A3A5C",
stone:    "#7A9CB8",
beige:    "#B8D4E8",
cream:    "#E8F2F8",
paper:    "#F4F9FC",

// ── Forest Green ──────────────────────────────────────────
ink:      "#1A2E1A",
charcoal: "#2D4A2D",
stone:    "#6B8C6B",
beige:    "#B8D4B8",
cream:    "#E8F2E8",
paper:    "#F4FAF4",

// ── Warm Terracotta ───────────────────────────────────────
ink:      "#2C1810",
charcoal: "#4A2C1C",
stone:    "#A0704A",
beige:    "#D4A882",
cream:    "#F2E8DC",
paper:    "#FBF5EE",

// ── Bold Luxury (deep navy + gold) ───────────────────────
ink:      "#0A0F2E",
charcoal: "#1A2444",
stone:    "#C9A84C",
beige:    "#E8D5A0",
cream:    "#F5EFD8",
paper:    "#FDFAF0",
```

### `backend/utils/emailService.js` — the `B` object (line ~20)

```js
const B = {
  ink:         "#1A1A1A",   // ← match Tailwind ink
  charcoal:    "#2B2B2B",   // ← match Tailwind charcoal
  stone:       "#A89F8E",   // ← match Tailwind stone
  cream:       "#F4F1EA",   // ← match Tailwind cream
  paper:       "#FAF8F4",   // ← match Tailwind paper
  // ...
};
```
// ── Dora Donuts — Baby Blue & Pink ──
const B = {
  ink:         "#3A3042",   // ← match Tailwind ink
  charcoal:    "#51445A",   // ← match Tailwind charcoal
  stone:       "#9FB8CC",   // ← match Tailwind stone
  cream:       "#D9EEFF",   // ← match Tailwind cream
  paper:       "#FFF8FA",   // ← match Tailwind paper
  // ...
};

Keep these in sync with Tailwind so emails look like the website.

---

## 3 — Fonts

Fonts are loaded in two places.

### `frontend/index.html` — Google Fonts import

Replace the `@import` link. Example — switching to a sharp, modern sans-serif:
```html
<!-- Remove this: -->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:...&family=Inter:...&display=swap" rel="stylesheet" />

<!-- Add your fonts, e.g. Playfair Display + DM Sans: -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

### `frontend/tailwind.config.js` — font family mapping

```js
fontFamily: {
  display: ["'Playfair Display'", "Georgia", "serif"],  // headings, logo, prices
  body:    ["'DM Sans'",  "Helvetica", "Arial", "sans-serif"],  // body copy
},
```

**`font-display`** is used for: the logo, all `<h1>–<h4>` tags, product names, section titles.
**`font-body`** is used for: paragraphs, labels, buttons, nav links, inputs.

**Popular combinations:**
| Display (headings) | Body (copy) | Vibe |
|---------------------|-------------|------|
| Fraunces (current) | Inter | Editorial / Literary |
| Playfair Display | DM Sans | Classic Luxury |
| Cormorant Garamond | Jost | High-fashion |
| Unbounded | Plus Jakarta Sans | Streetwear / Hype |
| DM Serif Display | Outfit | Clean Premium |
| Libre Baskerville | Lato | Heritage / Classic |

---

## 4 — Currency & Pricing

### Change the currency symbol

**`frontend/src/utils/format.js`** — one line:
```js
// Before:
return `${num.toLocaleString(...)} EGP`;

// After (e.g. US dollars):
return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Or Saudi Riyals:
return `${num.toLocaleString("ar-SA")} SAR`;
```

### Change tax rate & shipping thresholds

**`backend/controllers/orderController.js`** (top of file):
```js
const TAX_RATE = 0.14;             // ← 14% Egyptian VAT → change to 0.15 (KSA), 0.05 (UAE), etc.
const FLAT_SHIPPING = 60;          // ← flat fee in your local currency
const FREE_SHIPPING_THRESHOLD = 1500; // ← free shipping above this amount
```

**`frontend/src/pages/CartPage.jsx`** (top of file):
```js
const TAX_RATE = 0.14;             // ← must match backend value
const FLAT_SHIPPING = 60;          // ← must match backend value
const FREE_SHIPPING_THRESHOLD = 1500;
```

**`frontend/src/pages/CheckoutPage.jsx`** (top of file):
```js
const TAX_RATE = 0.14;
const FLAT_SHIPPING = 60;
const FREE_SHIPPING_THRESHOLD = 1500;
```

> 💡 **Tip:** Move these three constants into a shared `backend/.env` and `frontend/.env` variable
> (e.g. `VITE_TAX_RATE=0.14`) so you only change them in one place.

---

## 5 — Logo

Currently the logo is typographic (CSS text). To add an image logo:

### Option A — keep it typographic, just change the text
Edit the `FELT &amp; FORM` strings listed in Section 1 above.

### Option B — replace with an image logo

1. Add your logo file to `frontend/src/assets/logo.svg` (SVG recommended for crispness).

2. In **`frontend/src/components/layout/Navbar.jsx`**:
```jsx
import logo from "../../assets/logo.svg";

// Replace the text span with:
<Link to="/">
  <img src={logo} alt="Your Brand" className="h-8 w-auto" />
</Link>
```

3. Do the same in **`frontend/src/components/layout/Footer.jsx`** and **`frontend/src/components/layout/AdminLayout.jsx`**.

---

## 6 — Contact info & location

**`frontend/src/components/layout/Footer.jsx`** (contact block ~line 70):
```jsx
<span>12 El-Nozha St, Heliopolis, Cairo, Egypt</span>   // ← your address
<span>+20 100 000 0000</span>                            // ← your phone
<span>hello@feltandform.com</span>                       // ← your email
```

**`frontend/src/pages/ContactPage.jsx`** (info section):
```jsx
{ icon: MapPin, text: "Your Address, City, Country" },
{ icon: Phone,  text: "+1 555 000 0000" },
{ icon: Mail,   text: "hello@yourbrand.com" },
{ icon: Clock,  text: "Mon – Fri: 9:00 AM – 6:00 PM" },
```

**`backend/utils/emailService.js`** (footer of every email template, `B` object):
```js
website:     "https://yourbrand.com",
fromAddress: "hello@yourbrand.com",
```

And in the footer HTML string inside `baseLayout`:
```js
<p>${B.name} · Your Address, City, Country</p>
```

---

## 7 — Navigation links

**`frontend/src/components/layout/Navbar.jsx`** — the `NAV_LINKS` array:
```js
const NAV_LINKS = [
  { label: "Home",       to: "/" },
  { label: "Shop",       to: "/shop" },
  { label: "Men",        to: "/shop?gender=men" },    // ← rename or remove
  { label: "Women",      to: "/shop?gender=women" },  // ← rename or remove
  { label: "New In",     to: "/shop?tag=new" },       // ← any tag
  { label: "Sale",       to: "/shop?tag=sale" },
  { label: "About",      to: "/about" },
  { label: "Contact",    to: "/contact" },
];
```

Remove gender-specific links for unisex brands. Add new links for seasonal collections.

---

## 8 — Payment methods

The store ships with four Egyptian payment methods. Change them in **two files**:

### `backend/models/Order.js` — ENUM field
```js
payment_method: {
  type: DataTypes.ENUM(
    "cash_on_delivery",
    "credit_card",
    "vodafone_cash",   // ← remove or rename
    "instapay",        // ← remove or rename
    "apple_pay",       // ← add new
    "stc_pay",         // ← add for KSA
  ),
}
```

### `frontend/src/pages/CheckoutPage.jsx` — `PAYMENT_METHODS` array
```js
const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery" },
  { value: "credit_card",      label: "Credit / Debit Card" },
  { value: "apple_pay",        label: "Apple Pay" },
  { value: "stc_pay",          label: "STC Pay" },
];
```

After changing the ENUM, run `npm run seed` to recreate the table, or write a manual `ALTER TABLE` migration.

---

## 9 — Social media links

**`frontend/src/components/layout/Footer.jsx`** — social links block:
```jsx
<a href="https://instagram.com/yourbrand"  ...><Instagram size={18} /></a>
<a href="https://tiktok.com/@yourbrand"    ...><Music size={18} /></a>   // add TikTok
<a href="https://twitter.com/yourbrand"    ...><Twitter size={18} /></a>
```

Import any icon from `lucide-react`. For TikTok (not in Lucide), use an inline SVG.

---

## 10 — Categories

Edit the `CATEGORY_LIST` array in **`backend/seed.js`**:
```js
const CATEGORY_LIST = [
  { name: "Men",        description: "..." },
  { name: "Women",      description: "..." },
  { name: "Kids",       description: "..." },   // ← add new
  { name: "Sportswear", description: "..." },   // ← add new
  { name: "Footwear",   description: "..." },   // ← completely different product type
];
```

Then also update `CATEGORY_ICONS` in **`frontend/src/pages/HomePage.jsx`**:
```js
const CATEGORY_ICONS = {
  Kids:       "🧒",
  Sportswear: "🏃",
  Footwear:   "👟",
};
```

Re-run `npm run seed` after changing categories (**warning: this resets all data**).

---

## 11 — Email templates — deep branding

All 9 email templates share one `baseLayout` function in **`backend/utils/emailService.js`**.

Change the footer copy and the "Cairo · Egypt" sub-line in the header:
```js
// In baseLayout(), find:
<div class="header-sub">Cairo · Egypt</div>

// Change to:
<div class="header-sub">Your City · Your Country</div>

// Footer:
<p>${B.name} · Your Address, City, Country</p>
<p>© ${new Date().getFullYear()} ${B.name}. All rights reserved.</p>
```

To reskin all emails with a new accent colour (e.g. green CTA buttons instead of black):
```js
const B = {
  ink:  "#14532D",   // deep green replaces black everywhere
  // ...
};

// Button style in baseLayout():
.btn { background-color: ${B.ink}; ... }
```

---

## 12 — Hero section & taglines

**`frontend/src/pages/HomePage.jsx`**:
```jsx
// Sub-headline under the big logo
<p>Your tagline here.<br />Your second line of copy.</p>

// Split banner section (Men / Women)
// Replace with your own category names and colours
<Link to="/shop?gender=men" className="... bg-charcoal ...">
  <h3>Men</h3>     // ← rename e.g. "Summer" / "Winter"
</Link>
<Link to="/shop?gender=women" className="... bg-stone ...">
  <h3>Women</h3>   // ← rename e.g. "Footwear" / "Accessories"
</Link>
```

---

## 13 — About page

**`frontend/src/pages/AboutPage.jsx`** — the three brand story sections:
```jsx
const sections = [
  {
    eyebrow: "The idea",
    title:   "Your headline",
    body:    "Your brand story paragraph 1.",
  },
  {
    eyebrow: "The craft",
    title:   "Your headline",
    body:    "Your brand story paragraph 2.",
  },
  {
    eyebrow: "The future",
    title:   "Your headline",
    body:    "Your brand story paragraph 3.",
  },
];
```

---

## 14 — Seed data (product catalog)

**`backend/seed.js`** — replace or extend the `PRODUCT_CATALOG` array:
```js
const PRODUCT_CATALOG = [
  {
    name:        "Your Product Name",
    category:    "Men",              // must match a name in CATEGORY_LIST
    gender:      "men",              // "men" | "women" | "unisex"
    price:       1200,               // in your local currency (no decimals needed)
    discount:    0,                  // percentage, 0 = no discount
    stock:       40,
    material:    "100% Cotton",
    colors:      ["Black", "White"], // must match COLOR_LIST names
    sizes:       ["S", "M", "L", "XL"],
    tags:        ["new", "best_seller"], // "new"|"best_seller"|"trending"|"sale"
    description: "Product description here.",
  },
  // ... add as many as you want
];
```

---

## 15 — Environment variables checklist before launch

```env
# Brand identity
EMAIL_FROM_NAME=Your Brand Name
EMAIL_FROM_ADDRESS=hello@yourbrand.com
ADMIN_NOTIFY_EMAIL=admin@yourbrand.com
CLIENT_URL=https://yourbrand.com

# Database (use a managed MySQL 8 host in production)
DB_HOST=your-db-host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_strong_password
DB_SSL=true

# Security — MUST change before going live
JWT_SECRET=a-very-long-random-string-at-least-64-chars

# Email — use your real SMTP provider
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Business logic
LOW_STOCK_THRESHOLD=5
EMAIL_VERIFY_EXPIRES_MIN=30
PASSWORD_RESET_EXPIRES_MIN=15
```

---

## 16 — SMTP providers (plug-and-play)

| Provider | Free tier | SMTP host | Port |
|----------|-----------|-----------|------|
| **Mailtrap** (testing) | 1,000/month | sandbox.smtp.mailtrap.io | 2525 |
| **Resend** | 3,000/month | smtp.resend.com | 465 |
| **SendGrid** | 100/day | smtp.sendgrid.net | 587 |
| **Mailgun** | 100/day | smtp.mailgun.org | 587 |
| **Brevo** | 300/day | smtp-relay.brevo.com | 587 |
| **Gmail** (dev only) | — | smtp.gmail.com | 587 |

For Gmail: enable 2FA → Google Account → Security → App passwords → generate one.

---

## 17 — Complete rebrand checklist

- [ ] `.env`: update `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `CLIENT_URL`, `JWT_SECRET`
- [ ] `tailwind.config.js`: update 6 colour tokens
- [ ] `emailService.js`: update `B` object to match new colours
- [ ] `index.html`: update `<title>` and `<meta name="description">`
- [ ] `Navbar.jsx`: update brand name text and nav links
- [ ] `Footer.jsx`: update brand name, address, phone, email, social links
- [ ] `AdminLayout.jsx`: update admin panel brand name
- [ ] `LoginPage.jsx` + auth pages: update brand name headings
- [ ] `HomePage.jsx`: update hero tagline, category banner labels
- [ ] `AboutPage.jsx`: update brand story
- [ ] `ContactPage.jsx`: update address, phone, hours
- [ ] `seed.js`: update `CATEGORY_LIST` and `PRODUCT_CATALOG`
- [ ] `orderController.js`: update `TAX_RATE`, `FLAT_SHIPPING`, `FREE_SHIPPING_THRESHOLD`
- [ ] `CartPage.jsx` + `CheckoutPage.jsx`: update matching tax/shipping constants
- [ ] `CheckoutPage.jsx`: update `PAYMENT_METHODS`
- [ ] `Order.js` (model): update payment method ENUM to match
- [ ] Upload real product photos through `/admin/products`
- [ ] Upload real category images through `/admin/categories`
- [ ] Run `npm run seed` once on the fresh production database
- [ ] Change default admin password immediately after first login
