const express = require("express");
const router = express.Router();
const { checkout, getMyOrders, getOrderById } = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/checkout", checkout);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);

module.exports = router;
