const { Router } = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

// ── How this file is used ────────────────────────────────────────────────
// 1) `router` (JSON endpoints) is mounted once inside adminRoutes.js, right
//    after `router.use(protect, adminOnly)`:
//        router.use(require("../validators/adminValidators").router);
// 2) The four multipart endpoints (products/categories create+update) must be
//    validated AFTER multer has parsed the form, so they are exported as
//    ready-made arrays and inserted into those route lines individually.
// Anything not matched here passes straight through to the real handlers.

const id = (name = "id") =>
  param(name).isInt({ min: 1 }).withMessage("Invalid id.").toInt();

const str = (field, label, max, { required = false } = {}) => {
  const chain = body(field);
  if (!required) chain.optional({ values: "falsy" });
  return chain
    .isString().withMessage(`${label} must be text.`).bail()
    .trim()
    .isLength({ min: required ? 1 : 0, max })
    .withMessage(required ? `${label} is required (max ${max} characters).` : `${label} must be ${max} characters or fewer.`);
};

const num = (field, label, opts, { required = false } = {}) => {
  const chain = body(field);
  if (!required) chain.optional({ values: "falsy" });
  return chain.isFloat(opts).withMessage(`${label} is invalid.`);
};

const int = (field, label, opts, { required = false } = {}) => {
  const chain = body(field);
  if (!required) chain.optional({ values: "falsy" });
  return chain.isInt(opts).withMessage(`${label} is invalid.`);
};

const bool = (field, label) =>
  body(field).optional().isBoolean().withMessage(`${label} must be true or false.`);

// ── Products / categories (multipart — used per-route) ──────────────────
const tags = body("tags").optional({ values: "falsy" }).custom((v) => {
  let arr = v;
  if (typeof v === "string") {
    try { arr = JSON.parse(v); } catch { throw new Error("Tags must be a valid list."); }
  }
  if (!Array.isArray(arr) || arr.length > 10 || !arr.every((t) => typeof t === "string" && /^[a-z0-9_]{1,30}$/.test(t))) {
    throw new Error("Tags must be up to 10 short lowercase words.");
  }
  return true;
});

const productCommon = [
  str("description", "Description", 5000),
  num("discount", "Discount", { min: 0, max: 100 }),
  int("stock", "Stock", { min: 0, max: 1000000 }),
  int("category_id", "Category", { min: 1 }),
  tags,
  bool("is_active", "Status"),
];

const productCreate = [
  str("name", "Name", 150, { required: true }),
  num("price", "Price", { min: 0, max: 10000000 }, { required: true }),
  ...productCommon,
  validate,
];

const productUpdate = [
  str("name", "Name", 150),
  num("price", "Price", { min: 0, max: 10000000 }),
  ...productCommon,
  validate,
];

const categoryCreate = [
  str("name", "Name", 100, { required: true }),
  str("description", "Description", 2000),
  validate,
];

const categoryUpdate = [
  str("name", "Name", 100),
  str("description", "Description", 2000),
  validate,
];

// ── JSON endpoints (router) ─────────────────────────────────────────────
const router = Router();

// Products / images (deletes only — create/update are per-route above)
router.delete("/products/:id", id(), validate);
router.delete("/products/:id/images/:imageId", id(), id("imageId"), validate);

// Categories
router.delete("/categories/:id", id(), validate);

// Orders
router.get("/orders/:id", id(), validate);
router.put(
  "/orders/:id/status",
  id(),
  body("status").isIn(["pending", "processing", "shipped", "delivered", "cancelled"]).withMessage("Invalid status value."),
  validate
);
router.put(
  "/orders/:id/payment-status",
  id(),
  body("payment_status").isIn(["pending", "awaiting_transfer", "paid", "failed", "refunded"]).withMessage("Invalid payment status value."),
  validate
);

// Customers
router.put("/users/:id/block", id(), validate);
router.delete("/users/:id", id(), validate);

// Coupons
const couponCode = (required) => {
  const chain = body("code");
  if (!required) chain.optional({ values: "falsy" });
  return chain
    .isString().withMessage("Coupon code is required.").bail()
    .trim()
    .matches(/^[A-Za-z0-9_\-]{2,50}$/).withMessage("Coupon code may only contain letters, numbers, - and _ (2–50 characters).");
};
const dateOnly = (field, label, required) => {
  const chain = body(field);
  if (!required) chain.optional({ values: "falsy" });
  return chain.isISO8601({ strict: true, strictSeparator: true }).withMessage(`${label} must be a valid date.`);
};
const expiryAfterStart = body("expiry_date").custom((v, { req }) => {
  const start = req.body.start_date;
  if (v && start && String(v).slice(0, 10) < String(start).slice(0, 10)) {
    throw new Error("Expiry date can't be before the start date.");
  }
  return true;
});

router.post(
  "/coupons",
  couponCode(true),
  num("discount", "Discount", { gt: 0, max: 100 }, { required: true }),
  dateOnly("start_date", "Start date", true),
  dateOnly("expiry_date", "Expiry date", true),
  expiryAfterStart,
  int("usage_limit", "Usage limit", { min: 1, max: 1000000 }),
  num("minimum_order_amount", "Minimum order amount", { min: 0, max: 100000000 }),
  int("user_id", "Customer", { min: 1 }),
  validate
);
router.put(
  "/coupons/:id",
  id(),
  num("discount", "Discount", { gt: 0, max: 100 }),
  dateOnly("start_date", "Start date", false),
  dateOnly("expiry_date", "Expiry date", false),
  expiryAfterStart,
  int("usage_limit", "Usage limit", { min: 1, max: 1000000 }),
  num("minimum_order_amount", "Minimum order amount", { min: 0, max: 100000000 }),
  int("user_id", "Customer", { min: 1 }),
  bool("is_active", "Status"),
  validate
);
router.delete("/coupons/:id", id(), validate);
router.post("/coupons/:id/send-email", id(), validate);

// Zones
router.post(
  "/zones",
  str("name", "Area name", 100, { required: true }),
  num("shipping_price", "Shipping price", { min: 0, max: 100000 }, { required: true }),
  bool("is_deliverable", "Deliverable"),
  int("sort_order", "Sort order", { min: -1000, max: 1000 }),
  validate
);
router.put(
  "/zones/:id",
  id(),
  str("name", "Area name", 100),
  num("shipping_price", "Shipping price", { min: 0, max: 100000 }),
  bool("is_deliverable", "Deliverable"),
  int("sort_order", "Sort order", { min: -1000, max: 1000 }),
  validate
);
router.delete("/zones/:id", id(), validate);

// Rush hours
const timeOfDay = (field, label) =>
  body(field).optional({ values: "falsy" }).matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).withMessage(`${label} must be a valid time.`);
const dateTime = (field, label) =>
  body(field).optional({ values: "falsy" }).isISO8601().withMessage(`${label} must be a valid date and time.`);
const rushCommon = [
  body("schedule_type").optional().isIn(["recurring_daily", "one_off"]).withMessage("Invalid schedule type."),
  timeOfDay("start_time", "Start time"),
  timeOfDay("end_time", "End time"),
  dateTime("start_at", "Start"),
  dateTime("end_at", "End"),
  bool("is_active", "Status"),
];

router.post(
  "/rush-hours",
  str("name", "Name", 100, { required: true }),
  num("discount_percent", "Discount", { gt: 0, max: 100 }, { required: true }),
  body("schedule_type").isIn(["recurring_daily", "one_off"]).withMessage("Invalid schedule type."),
  ...rushCommon.slice(1),
  body("product_ids").isArray({ min: 1, max: 500 }).withMessage("Select at least one product."),
  body("product_ids.*").isInt({ min: 1 }).withMessage("Invalid product selected."),
  validate
);
router.put(
  "/rush-hours/:id",
  id(),
  str("name", "Name", 100),
  num("discount_percent", "Discount", { gt: 0, max: 100 }),
  ...rushCommon,
  body("product_ids").optional().isArray({ min: 1, max: 500 }).withMessage("Select at least one product."),
  body("product_ids.*").optional().isInt({ min: 1 }).withMessage("Invalid product selected."),
  validate
);
router.delete("/rush-hours/:id", id(), validate);

// Returns / cancellations (admin review)
router.put(
  "/returns/:id",
  id(),
  body("status").optional().isIn(["pending", "reviewing", "approved", "rejected", "refunded", "exchanged", "closed"]).withMessage("Invalid status."),
  str("admin_notes", "Admin notes", 5000),
  str("rejection_reason", "Rejection reason", 2000),
  num("refund_amount", "Refund amount", { min: 0, max: 100000000 }),
  body("refund_method").optional({ values: "falsy" }).isIn(["original_payment", "store_credit", "bank_transfer"]).withMessage("Invalid refund method."),
  str("refund_reference", "Refund reference", 100),
  validate
);
router.delete("/returns/:id/images/:index", id(), param("index").isInt({ min: 0, max: 50 }).withMessage("Invalid image index."), validate);

module.exports = { router, productCreate, productUpdate, categoryCreate, categoryUpdate };
