const { Product, Category } = require("../models");

const SITE_URL = process.env.CLIENT_URL || "http://localhost:5173";

// @route GET /sitemap.xml
const getSitemap = async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.findAll({
        where: { is_active: true },
        attributes: ["slug", "updatedAt"],
        order: [["updatedAt", "DESC"]],
      }),
      Category.findAll({
        attributes: ["slug", "updatedAt"],
      }),
    ]);

    const toDate = (d) => new Date(d).toISOString().split("T")[0];
    const today  = toDate(new Date());

    const staticPages = [
      { loc: "/",            priority: "1.0", changefreq: "daily",   lastmod: today },
      { loc: "/shop",        priority: "0.9", changefreq: "daily",   lastmod: today },
      { loc: "/about",       priority: "0.6", changefreq: "monthly", lastmod: today },
      { loc: "/contact",     priority: "0.6", changefreq: "monthly", lastmod: today },
      { loc: "/faq",         priority: "0.5", changefreq: "monthly", lastmod: today },
      { loc: "/size-guide",  priority: "0.7", changefreq: "monthly", lastmod: today },
      { loc: "/login",       priority: "0.3", changefreq: "yearly",  lastmod: today },
    ];

    const catPages = categories.map(c => ({
      loc: `/shop?category=${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: toDate(c.updatedAt),
    }));

    const productPages = products.map(p => ({
      loc: `/product/${p.slug}`,
      priority: "0.9",
      changefreq: "weekly",
      lastmod: toDate(p.updatedAt),
    }));

    const allUrls = [...staticPages, ...catPages, ...productPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600"); // cache 1 hour
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

// @route GET /robots.txt
const getRobots = (req, res) => {
  const SITE_URL = process.env.CLIENT_URL || "http://localhost:5173";
  res.set("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /

# Block admin and user-specific pages
Disallow: /admin/
Disallow: /checkout
Disallow: /cart
Disallow: /profile
Disallow: /wishlist
Disallow: /order-success/
Disallow: /cancel-order/
Disallow: /return-order/
Disallow: /verify-email
Disallow: /reset-password
Disallow: /forgot-password

# Block API
Disallow: /api/

# Crawl delay (be polite to the server)
Crawl-delay: 1

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml
`);
};

module.exports = { getSitemap, getRobots };
