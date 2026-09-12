const express = require("express");
const router = express.Router();
const {
  submitRequest,
  getMyRequests,
  getRequestById,
  getPolicy,
} = require("../controllers/returnController");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Multer config for return evidence photos
const uploadsDir = path.join(__dirname, "..", "uploads", "returns");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});
const fileFilter = (req, file, cb) =>
  ["image/jpeg","image/png","image/webp","image/jpg"].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only image files are accepted."));

const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024, files: 5 } });

router.get("/policy", getPolicy);
router.use(protect);
router.post("/", upload.array("images", 5), submitRequest);
router.get("/my-requests", getMyRequests);
router.get("/:id", getRequestById);

module.exports = router;
