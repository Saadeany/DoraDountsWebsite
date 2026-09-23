const { Router } = require("express");
const { body, query } = require("express-validator");
const validate = require("../middleware/validate");

// Mounted in server.js BEFORE the real /api/auth routes. Every handler here
// either responds 400 or calls next(), so the existing controllers run
// unchanged for valid input.
//
// Passwords are never trimmed or altered. Max 72 chars on NEW passwords
// because bcrypt ignores everything past 72 bytes.
const router = Router();

const email = body("email")
  .isString().withMessage("Email is required.").bail()
  .trim()
  .isEmail().withMessage("Please enter a valid email address.").bail()
  .isLength({ max: 150 }).withMessage("Email must be 150 characters or fewer.");

const newPassword = (field) =>
  body(field)
    .isString().withMessage("Password is required.").bail()
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.").bail()
    .isLength({ max: 72 }).withMessage("Password must be 72 characters or fewer.");

const name = (field, label) =>
  body(field)
    .isString().withMessage(`${label} is required.`).bail()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage(`${label} must be between 1 and 50 characters.`);

const secureToken = (source, field) =>
  source(field)
    .isString().withMessage("Token is required.").bail()
    .isHexadecimal().withMessage("Invalid token.").bail()
    .isLength({ min: 16, max: 128 }).withMessage("Invalid token.");

router.post(
  "/register",
  name("first_name", "First name"),
  name("last_name", "Last name"),
  email,
  newPassword("password"),
  body("phone")
    .optional({ values: "falsy" })
    .isString().bail()
    .matches(/^[0-9+()\-\s]{6,20}$/).withMessage("Please enter a valid phone number."),
  validate
);

router.post(
  "/login",
  email,
  body("password")
    .isString().withMessage("Password is required.").bail()
    .isLength({ min: 1, max: 128 }).withMessage("Invalid email or password."),
  validate
);

router.post("/forgot-password", email, validate);

router.post(
  "/reset-password",
  secureToken(body, "token"),
  newPassword("new_password"),
  validate
);

router.put(
  "/change-password",
  body("current_password")
    .isString().withMessage("Current password is required.").bail()
    .isLength({ min: 1, max: 128 }).withMessage("Current password is incorrect."),
  newPassword("new_password"),
  validate
);

router.get("/verify-email", secureToken(query, "token"), validate);

router.put(
  "/addresses",
  body("addresses").isArray({ max: 10 }).withMessage("Addresses must be a list of up to 10 entries."),
  body("addresses.*.full_name").optional().isString().isLength({ max: 100 }).withMessage("Address name is too long."),
  body("addresses.*.phone").optional().isString().isLength({ max: 20 }).withMessage("Address phone is too long."),
  body("addresses.*.city").optional().isString().isLength({ max: 100 }).withMessage("Address city is too long."),
  body("addresses.*.area").optional().isString().isLength({ max: 100 }).withMessage("Address area is too long."),
  body("addresses.*.address").optional().isString().isLength({ max: 255 }).withMessage("Street address is too long."),
  body("addresses.*.building_number").optional().isString().isLength({ max: 50 }).withMessage("Building number is too long."),
  body("addresses.*.floor").optional().isString().isLength({ max: 20 }).withMessage("Floor is too long."),
  body("addresses.*.apartment_number").optional().isString().isLength({ max: 20 }).withMessage("Apartment number is too long."),
  body("addresses.*.latitude").optional({ values: "falsy" }).isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude."),
  body("addresses.*.longitude").optional({ values: "falsy" }).isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude."),
  validate
);

module.exports = router;
