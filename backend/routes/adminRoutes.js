const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { uploadProductImages, uploadCategoryImage } = require("../middleware/upload");

const { getDashboardStats } = require("../controllers/adminController");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getAllProductsAdmin,
} = require("../controllers/productController");
const { createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { getAllOrders, updateOrderStatus, updateOrderPaymentStatus, getOrderById } = require("../controllers/orderController");
const { getUsers, toggleBlockUser, deleteUser } = require("../controllers/userController");
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  sendCouponEmail,
} = require("../controllers/couponController");
const {
  getAdminZones,
  createZone,
  updateZone,
  deleteZone,
} = require("../controllers/zoneController");
const {
  getAdminRushHours,
  createRushHour,
  updateRushHour,
  deleteRushHour,
} = require("../controllers/rushHourController");

// New: express-validator chains. `adminValidators.router` covers every JSON
// admin endpoint below (it's a no-op passthrough for anything it doesn't
// recognize); the four product/category arrays are spliced individually
// into their routes since those bodies only exist after multer parses the
// multipart form.
const adminValidators = require("../validators/adminValidators");

// Every route below requires a valid admin JWT
router.use(protect, adminOnly);

// Validates every matching JSON admin route below before it reaches its
// controller (400 + {message} on bad input; passes through otherwise).
router.use(adminValidators.router);

// ---- Dashboard ----
router.get("/stats", getDashboardStats);

// ---- Products ----
router.get("/products", getAllProductsAdmin);
router.post("/products", uploadProductImages.array("images", 8), ...adminValidators.productCreate, createProduct);
router.put("/products/:id", uploadProductImages.array("images", 8), ...adminValidators.productUpdate, updateProduct);
router.delete("/products/:id", deleteProduct);
router.delete("/products/:id/images/:imageId", deleteProductImage);

// ---- Categories ----
router.post("/categories", uploadCategoryImage.single("image"), ...adminValidators.categoryCreate, createCategory);
router.put("/categories/:id", uploadCategoryImage.single("image"), ...adminValidators.categoryUpdate, updateCategory);
router.delete("/categories/:id", deleteCategory);

// ---- Orders ----
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", updateOrderStatus);
router.put("/orders/:id/payment-status", updateOrderPaymentStatus);

// ---- Customers ----
router.get("/users", getUsers);
router.put("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);

// ---- Coupons ----
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.post("/coupons/:id/send-email", sendCouponEmail);

// ---- Zones (delivery areas) ----
router.get("/zones", getAdminZones);
router.post("/zones", createZone);
router.put("/zones/:id", updateZone);
router.delete("/zones/:id", deleteZone);

// ---- Rush Hour (timed flash discounts) ----
router.get("/rush-hours", getAdminRushHours);
router.post("/rush-hours", createRushHour);
router.put("/rush-hours/:id", updateRushHour);
router.delete("/rush-hours/:id", deleteRushHour);

module.exports = router;

// ---- Returns / Cancellations ----
const { getAllRequests, updateRequest, deleteRequestImage } = require("../controllers/returnController");
router.get("/returns",                    getAllRequests);
router.put("/returns/:id",                updateRequest);
router.delete("/returns/:id/images/:index", deleteRequestImage);
