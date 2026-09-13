require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const sanitizeInput = require("./middleware/sanitize");

const authRoutes         = require("./routes/authRoutes");
const productRoutes      = require("./routes/productRoutes");
const categoryRoutes     = require("./routes/categoryRoutes");
const cartRoutes         = require("./routes/cartRoutes");
const wishlistRoutes     = require("./routes/wishlistRoutes");
const orderRoutes        = require("./routes/orderRoutes");
const reviewRoutes       = require("./routes/reviewRoutes");
const couponRoutes       = require("./routes/couponRoutes");
const newsletterRoutes   = require("./routes/newsletterRoutes");
const metaRoutes         = require("./routes/metaRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const emailLogRoutes     = require("./routes/emailLogRoutes");
const contactRoutes      = require("./routes/contactRoutes");
const zoneRoutes         = require("./routes/zoneRoutes");
const rushHourRoutes     = require("./routes/rushHourRoutes");

const app = express();
app.set("trust proxy", 1);


app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

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
app.use("/api/meta",          metaRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/email-logs", emailLogRoutes);
app.use("/api/contact",       contactRoutes);
app.use("/api/zones",         zoneRoutes);
app.use("/api/rush-hour",     rushHourRoutes);
const returnRoutes       = require("./routes/returnRoutes");
app.use("/api/returns",         returnRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Felt & Form API running on http://localhost:${PORT}`));
};
startServer();
module.exports = app;
