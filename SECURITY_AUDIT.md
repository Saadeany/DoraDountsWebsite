# Security Review — Felt & Form

Reviewed against the current codebase. Split into: things to fix before going
live, things worth fixing soon, and things that are already handled well.

---

## Fix before going live

### 1. Demo customer account has a hardcoded, public password
`backend/seed.js` always creates `customer@feltandform.com` / `Customer@123` —
this isn't read from an env var, it's a literal string in the file. Worse,
`frontend/src/pages/LoginPage.jsx` prints it directly on the login screen:

```jsx
<p className="mt-6 text-center text-xs text-charcoal/60">
  Demo: customer@feltandform.com / Customer@123
</p>
```

If you run `seed.js` against production and deploy this page as-is, anyone
can log in as that customer, see their order history, and place orders in
their name. Before launch:
- Remove the demo-credentials `<p>` from `LoginPage.jsx` (or gate it behind
  `import.meta.env.DEV`)
- Either skip creating the demo customer in `seed.js` for production, or gate
  it behind `if (process.env.NODE_ENV !== "production")`

### 2. `trust proxy` was missing
Every request in this Docker setup arrives via nginx, so Express only ever
saw nginx's internal IP as the requester — meaning `express-rate-limit`
effectively rate-limited *everyone combined* as one client, not per-visitor.
Fixed in `backend/server.js.patched` with `app.set("trust proxy", 1)`. Apply
this before deploying.

### 3. Default secrets in every `.env.example`
`JWT_SECRET`, `SEED_ADMIN_PASSWORD`, DB passwords, and SMTP creds all ship
with placeholder or weak example values. Anyone who's seen this repo (or a
public GitHub copy of it) knows the shape of your defaults. Generate real
random values for every secret in `backend/.env` — see DEPLOYMENT.md step 2.
A leaked or default `JWT_SECRET` means anyone can forge admin tokens.

### 4. No TLS by default
The Docker setup as built serves plain HTTP. Passwords, JWTs, and session
cookies would cross the network unencrypted. This is solved in
DEPLOYMENT.md (host nginx + certbot, or Caddy) — just don't skip that step.

---

## Worth fixing soon

### 5. Axios 401 interceptor clears the token but doesn't redirect
`frontend/src/api/axios.js` clears `ff_token`/`ff_user` from localStorage on
a 401, but the user stays on whatever page they were on with stale UI state
until they navigate manually. Not a security hole exactly, but it means a
session that's expired or been invalidated server-side (e.g. after a block)
doesn't visibly log the user out — add a redirect to `/login` in that
interceptor.

### 6. No server-side session revocation
JWTs are valid for 7 days (`JWT_EXPIRES_IN`) with no blacklist — "logout" is
purely a client-side `localStorage.removeItem`. If a token is stolen (XSS,
malicious extension, shared computer), it stays valid until it expires
regardless of the user "logging out." If this matters for your threat model,
consider a short-lived JWT + refresh token pair, or a server-side token
version/blacklist check in `middleware/auth.js`.

### 7. `express-validator` is installed but unused
It's in `package.json` but every controller does manual `if (!field)`
checks instead. This works today but is easy to get wrong as the API grows
(e.g. missing type checks, missing length limits on free-text fields like
`comment` in reviews or `description` in return requests). Worth migrating
critical routes (auth, checkout, admin writes) to `express-validator` chains
for consistent, centralized validation.

### 8. `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })`
This loosens Cross-Origin-Resource-Policy so product images can be embedded
cross-origin — a reasonable, deliberate tradeoff for an e-commerce image CDN
pattern, just flagging it so it's a conscious choice rather than an
oversight. If you never actually need cross-origin embedding of `/uploads`,
tightening this to `same-origin` is safer.

### 9. `DB_SSL` defaults to off
Fine for the Dockerized MySQL container on the same host/network, but if you
later move to a managed MySQL provider (PlanetScale, RDS, DO Managed DB) —
mentioned as an option in the README — flip `DB_SSL=true`.

---

## Already handled well (verified in the code)

- **Passwords**: bcrypt, cost factor 12 (`authController.js`)
- **SQL injection**: all queries go through Sequelize's parameterized query
  builder; the one raw `sequelize.query` (stock decrement in
  `orderController.js`) uses named `replacements`, not string interpolation
- **XSS**: `middleware/sanitize.js` strips HTML from `req.body`/`query`/`params`
  recursively, with password fields correctly excluded so special characters
  in passwords survive
- **Password reset enumeration**: `forgotPassword` returns the identical
  response whether or not the email exists — correct, prevents account
  enumeration
- **File uploads**: MIME-type whitelist, size cap, and randomized filenames
  (`crypto.randomBytes`) prevent path traversal and executable uploads
- **Admin routes**: every route in `adminRoutes.js` runs through
  `protect` + `adminOnly`, which re-checks the role server-side rather than
  trusting a client-sent role
- **Blocked users**: `middleware/auth.js` checks `is_blocked` on every
  authenticated request, not just at login — a blocked user's existing
  token stops working immediately
- **Rate limiting**: global (500/15min) and a tighter auth-specific limiter
  (20/15min) on login/register/forgot-password — good baseline against
  credential stuffing and brute force, once `trust proxy` is set correctly
- **Coupon codes**: usage limits, date ranges, and minimum-order checks are
  all enforced server-side in `checkout()`, not just in the UI — an attacker
  can't bypass them by calling the API directly

---

## Docker/VPS-specific hardening already baked into the provided files

- Backend and frontend containers both run as non-root (`node`/`nginx`
  image defaults)
- MySQL is not exposed to the host — only reachable inside the Docker
  network by the backend
- `.env` files are excluded from the Docker build context via
  `.dockerignore`, so secrets never end up baked into an image layer
- Health checks on all three services so `docker compose ps` and your
  process supervisor actually know when something's degraded
- Static assets served with cache headers; API responses are not cached

## Recommended VPS-level hardening (outside the app itself)

- `ufw` (or your provider's firewall) allowing only 22 (SSH, ideally
  key-only + non-standard port), 80, 443
- `fail2ban` on the SSH port
- Automatic security updates for the host OS (`unattended-upgrades` on
  Debian/Ubuntu)
- A non-root sudo user for all deployment/SSH work — never `root` directly
- Automated, off-VPS database backups (see DEPLOYMENT.md) — a full disk
  failure shouldn't mean losing all orders
