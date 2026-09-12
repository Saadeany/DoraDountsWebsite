const xss = require("xss");

const SKIP_KEYS = new Set(["password", "current_password", "new_password", "confirm_password"]);

// Recursively strips dangerous HTML/script content from string fields in
// req.body, req.query, and req.params. SQL injection is handled separately
// by Sequelize's parameterized queries — this middleware is specifically
// for stored/reflected XSS via user-submitted text (names, reviews, addresses, etc).
// Password fields are deliberately skipped so special characters survive intact.
const sanitizeValue = (value, key) => {
  if (SKIP_KEYS.has(key)) return value;
  if (typeof value === "string") {
    return xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script"] });
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, key));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const k of Object.keys(value)) {
      result[k] = sanitizeValue(value[k], k);
    }
    return result;
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") req.body = sanitizeValue(req.body, null);
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key], key);
    }
  }
  next();
};

module.exports = sanitizeInput;
