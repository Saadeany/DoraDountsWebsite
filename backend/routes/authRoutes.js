const express = require("express");
const router = express.Router();
const {
  register, login, getMe, updateProfile, changePassword, updateAddresses,
  verifyEmail, resendVerification, forgotPassword, resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { uploadProfileImage } = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, uploadProfileImage.single("profile_image"), updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/addresses", protect, updateAddresses);

// Email verification
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendVerification);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
