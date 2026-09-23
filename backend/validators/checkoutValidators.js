const { Router } = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

// Two routers, mounted in server.js before their real routes:
//   app.use("/api/orders",  checkout.orders)
//   app.use("/api/coupons", checkout.coupons)

const text = (field, label, max, { required = true } = {}) => {
  const chain = body(field);
  if (!required) chain.optional({ values: "falsy" });
  return chain
    .isString().withMessage(`${label} is required.`).bail()
    .trim()
    .isLength({ min: required ? 1 : 0, max })
    .withMessage(required ? `${label} is required (max ${max} characters).` : `${label} must be ${max} characters or fewer.`);
};

const orders = Router();

orders.post(
  "/checkout",
  text("shipping_full_name", "Full name", 100),
  body("shipping_phone")
    .isString().withMessage("Phone is required.").bail()
    .trim()
    .matches(/^[0-9+()\-\s]{6,20}$/).withMessage("Please enter a valid phone number."),
  body("shipping_email")
    .isString().withMessage("Email is required.").bail()
    .trim()
    .isEmail().withMessage("Please enter a valid email address.").bail()
    .isLength({ max: 150 }).withMessage("Email must be 150 characters or fewer."),
  text("shipping_country", "Country", 100),
  text("shipping_address", "Street address", 255),
  text("shipping_building", "Building", 50, { required: false }),
  text("shipping_floor", "Floor", 20, { required: false }),
  text("shipping_apartment", "Apartment", 20, { required: false }),
  body("zone_id")
    .exists({ values: "falsy" }).withMessage("Please select a delivery area.").bail()
    .isInt({ min: 1 }).withMessage("The selected delivery area is invalid."),
  body("payment_method")
    .isIn(["cash_on_delivery", "vodafone_cash", "instapay"]).withMessage("Invalid payment method."),
  body("coupon_code")
    .optional({ values: "falsy" })
    .isString().bail()
    .trim()
    .matches(/^[A-Za-z0-9_\-]{2,50}$/).withMessage("Coupon code is invalid."),
  body("shipping_lat").optional({ values: "falsy" }).isFloat({ min: -90, max: 90 }).withMessage("Invalid map location."),
  body("shipping_lng").optional({ values: "falsy" }).isFloat({ min: -180, max: 180 }).withMessage("Invalid map location."),
  validate
);

const coupons = Router();

coupons.post(
  "/validate",
  body("code")
    .isString().withMessage("Coupon code is required.").bail()
    .trim()
    .matches(/^[A-Za-z0-9_\-]{2,50}$/).withMessage("Invalid coupon code."),
  body("subtotal").optional({ values: "falsy" }).isFloat({ min: 0, max: 100000000 }).withMessage("Invalid subtotal."),
  validate
);

module.exports = { orders, coupons };
