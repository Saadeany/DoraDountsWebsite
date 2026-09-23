require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const sanitizeInput = require("./middleware/sanitize");
const securityAudit = require("./middleware/securityAudit");
const { checkProductionEnv, proxyTrustProbe } = require("./utils/envCheck");
const logger = require("./utils/securityLogger");

const authRoutes         = require("./routes/authRoutes");
const productRoutes      = require("./routes/productRoutes");
const categoryRoutes     = require("./routes/categoryRoutes");
const cartRoutes         = require("./routes/cartRoutes");
const wishlistRoutes     = require("./routes/wishlistRoutes");
const orderRoutes        = require("./routes/orderRoutes");
const reviewRoutes       = require("./routes/reviewRoutes");
const couponRoutes       = require("./routes/couponRoutes");
const newsletterRoutes   = require("./routes/newsletterRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const emailLogRoutes     = require("./routes/emailLogRoutes");
const contactRoutes      = require("./routes/contactRoutes");
const zoneRoutes         = require("./routes/zoneRoutes");
const rushHourRoutes     = require("./routes/rushHourRoutes");
const returnRoutes       = require("./routes/returnRoutes");

// New: express-validator chains for the highest-value input surfaces.
// Each one only rejects malformed input (400, same {message} shape the
// frontend already reads) — anything valid passes straight to the
// existing, unmodified controllers.
const authValidators     = require("./validators/authValidators");
const checkoutValidators = require("./validators/checkoutValidators");

const app = express();

// trust proxy: how many hops of reverse proxy sit in front of this process.
// Default 1 matches the shipped docker-compose (nginx/Caddy -> frontend ->
// backend is NOT hops here; only proxies in front of THIS process count —
// with the provided Caddy/host-nginx setup that's exactly 1). If you add
// another layer (e.g. a cloud load balancer in front of Caddy), increase via
// TRUST_PROXY_HOPS rather than editing this file.
const trustProxyHops = parseInt(process.env.TRUST_PROXY_HOPS, 10) || 1;
app.set("trust proxy", trustProxyHops);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

// Warns (or, with STRICT_ENV_CHECK=true, refuses to boot) if this looks like
// a deployed environment but NODE_ENV/JWT_SECRET/CLIENT_URL/etc. still look
// like local defaults. No-ops on a plain local dev machine.
checkProductionEnv(app);

app.use(proxyTrustProbe);
app.use(securityAudit);

const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false, message: { message: "Too many requests, please try again later." } });
app.use("/api", apiLimiter);

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(sanitizeInput);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Input validation (must run AFTER json/urlencoded body parsing, BEFORE
// the real routers below) ──────────────────────────────────────────────
app.use("/api/auth", authValidators);
app.use("/api/orders", checkoutValidators.orders);
app.use("/api/coupons", checkoutValidators.coupons);

// ── SEO: sitemap.xml + robots.txt ──────────────────────────────────────────
const { getSitemap, getRobots } = require("./controllers/sitemapController");
app.get("/sitemap.xml", getSitemap);
app.get("/robots.txt",  getRobots);
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth",          authRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/categories",    categoryRoutes);
app.use("/api/cart",          cartRoutes);
app.use("/api/wishlist",      wishlistRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/coupons",       couponRoutes);
app.use("/api/newsletter",    newsletterRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/email-logs", emailLogRoutes);
app.use("/api/contact",       contactRoutes);
app.use("/api/zones",         zoneRoutes);
app.use("/api/rush-hour",     rushHourRoutes);
app.use("/api/returns",       returnRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info("server_started", { port: PORT, nodeEnv: process.env.NODE_ENV, trustProxy: app.get("trust proxy") });
    console.log(`🚀 Dora Donuts & Pastry API running on http://localhost:${PORT}`);
  });
};
startServer();
module.exports = app;
