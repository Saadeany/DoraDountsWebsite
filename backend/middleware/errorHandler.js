const multer = require("multer");

const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ message: "Validation failed.", errors: messages });
  }

  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  // Only ever trust err.message for errors WE deliberately threw with a 4xx
  // statusCode (e.g. OUT_OF_STOCK, COUPON_LIMIT_REACHED above). Anything
  // that reaches here as a 500 is an unexpected exception — in production
  // it could be a DB error, a filesystem path, or other internal detail,
  // so it gets a generic message. Full detail still goes to console.error above.
  const safeMessage =
    statusCode < 500
      ? err.message || "Request could not be processed."
      : isProd
      ? "Something went wrong on our end. Please try again shortly."
      : err.message || "Internal server error.";

  res.status(statusCode).json({
    message: safeMessage,
    ...(!isProd && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };