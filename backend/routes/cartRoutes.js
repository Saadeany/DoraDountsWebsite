const express = require("express");
const router = express.Router();
const {
  getCart,
  getSavedForLater,
  addToCart,
  updateCartItem,
  removeCartItem,
  toggleSaveForLater,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getCart);
router.get("/saved", getSavedForLater);
router.post("/", addToCart);
router.put("/:id", updateCartItem);
router.delete("/:id", removeCartItem);
router.put("/:id/save-for-later", toggleSaveForLater);

module.exports = router;
