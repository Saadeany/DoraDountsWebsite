const multer = require("multer");

// Catch-all 404 for unmatched routes
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler. Keeps stack traces out of API responses in production.
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
  res.status(statusCode).json({
    message: err.message || "Something went wrong on the server.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
