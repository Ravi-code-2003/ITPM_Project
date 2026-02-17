const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { upload, handleUploadError } = require("../utils/upload");

// Public routes
router.post("/register", upload.single("proofImage"), handleUploadError, registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", protect, getUserProfile);

module.exports = router;