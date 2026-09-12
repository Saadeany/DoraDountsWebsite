const crypto = require("crypto");

// Generates a human-friendly, unique order reference, e.g. FF-20260617-8F3K
const generateOrderNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `FF-${datePart}-${randomPart}`;
};

module.exports = generateOrderNumber;
