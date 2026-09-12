import { useEffect } from "react";

/**
 * useSEO — sets document.title, meta description, and Open Graph tags
 * for any page, without needing a third-party library.
 *
 * @param {object} opts
 * @param {string} opts.title        - page-specific title (the brand suffix is appended automatically)
 * @param {string} opts.description  - meta description (max ~160 chars)
 * @param {string} [opts.image]      - absolute URL for og:image (WhatsApp / Facebook share preview)
 * @param {string} [opts.url]        - canonical URL (defaults to window.location.href)
 * @param {string} [opts.type]       - og:type, default "website" (use "product" for product pages)
 * @param {number} [opts.price]      - product price for og:price:amount
 */
const BRAND = "Dora Donuts";
const DEFAULT_DESCRIPTION =
  "Freshly made donuts, signature flavors, and sweet treats crafted in Cairo.";
const BASE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5173";

const setMeta = (name, content, property = false) => {
  if (!content) return;
  const attr   = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const useSEO = ({ title, description, image, url, type = "website", price } = {}) => {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BRAND}` : `${BRAND} — Freshly Crafted`;
    const desc      = description || DEFAULT_DESCRIPTION;
    const canonical = url || (typeof window !== "undefined" ? window.location.href : BASE_URL);
    const ogImage   = image || `${BASE_URL}/og-default.png`;

    // ── HTML title ─────────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Standard meta ──────────────────────────────────────────────────
    setMeta("description", desc);
    setMeta("robots", "index, follow");

    // ── Open Graph (Facebook, WhatsApp preview) ────────────────────────
    setMeta("og:type",        type,      true);
    setMeta("og:title",       fullTitle, true);
    setMeta("og:description", desc,      true);
    setMeta("og:image",       ogImage,   true);
    setMeta("og:url",         canonical, true);
    setMeta("og:site_name",   BRAND,     true);
    setMeta("og:locale",      "en_EG",   true);

    // ── Twitter Card ───────────────────────────────────────────────────
    setMeta("twitter:card",        "summary_large_image");
    setMeta("twitter:title",       fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image",       ogImage);

    // ── Product-specific (for product pages) ───────────────────────────
    if (price !== undefined) {
      setMeta("og:price:amount",   String(price),  true);
      setMeta("og:price:currency", "EGP",          true);
    }

    // ── Canonical link ─────────────────────────────────────────────────
    let linkEl = document.querySelector("link[rel='canonical']");
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.setAttribute("rel", "canonical");
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute("href", canonical);

  }, [title, description, image, url, type, price]);
};

export default useSEO;
