const { validationResult } = require("express-validator");
const logger = require("../utils/securityLogger");

// Runs after a validation chain. On failure it responds 400 with the same
// `{ message }` shape the frontend already reads (`err.response.data.message`),
// plus an `errors` array for per-field display.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result
    .array({ onlyFirstError: true })
    .map((e) => ({ field: e.path, message: e.msg }));

  // Field names only — never values (they may contain passwords).
  logger.warn("validation_failed", { ...logger.fromReq(req), fields: errors.map((e) => e.field) });

  return res.status(400).json({ message: errors[0].message, errors });
};

module.exports = validate;
