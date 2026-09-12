const express = require("express");
const router = express.Router();
const {
  getProducts,
  getSearchSuggestions,
  getProductBySlug,
} = require("../controllers/productController");

// Public routes
router.get("/", getProducts);
router.get("/search-suggestions", getSearchSuggestions);
router.get("/:slug", getProductBySlug);

module.exports = router;
