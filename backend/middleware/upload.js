const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const makeStorage = (subfolder) => {
  const dir = path.join(__dirname, "..", "uploads", subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = crypto.randomBytes(16).toString("hex");
      cb(null, `${Date.now()}-${unique}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP image files are allowed."));
  }
};

const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024;

const uploadProductImages = multer({
  storage: makeStorage("products"),
  fileFilter,
  limits: { fileSize: maxSize },
});

const uploadCategoryImage = multer({
  storage: makeStorage("categories"),
  fileFilter,
  limits: { fileSize: maxSize },
});

const uploadProfileImage = multer({
  storage: makeStorage("profiles"),
  fileFilter,
  limits: { fileSize: maxSize },
});

module.exports = { uploadProductImages, uploadCategoryImage, uploadProfileImage };
