const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateOTP, getOTPExpiry, isOTPExpired } = require("../utils/otp");
const { sendOTPEmail } = require("../utils/emailService");
const { uploadToCloudinary } = require("../utils/upload");
const joi = require("joi");

// Validation schemas
const registerSchema = joi.object({
  fullName: joi.string().required().min(2).max(50).trim(),
  email: joi.string().email().required().lowercase().trim(),
  password: joi.string().min(6).required(),
  role: joi.string().valid("student", "shop-owner", "house-owner", "education-path").required(),
  // Shop Owner specific
  shopName: joi.when("role", { is: "shop-owner", then: joi.string().required(), otherwise: joi.optional() }),
  location: joi.when("role", { is: "shop-owner", then: joi.string().required(), otherwise: joi.optional() }),
  // House Owner specific
  address: joi.when("role", { is: "house-owner", then: joi.string().required(), otherwise: joi.optional() }),
  // Education Path specific
  organizationName: joi.when("role", { is: "education-path", then: joi.string().required(), otherwise: joi.optional() }),
  organizationType: joi.when("role", { is: "education-path", then: joi.string().valid("club", "company", "NGO", "institute", "university-group").required(), otherwise: joi.optional() }),
  organizationEmail: joi.when("role", { is: "education-path", then: joi.string().email().required(), otherwise: joi.optional() }),
}).unknown(true);

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: "Validation error", 
        details: error.details[0].message 
      });
    }

    const {
      fullName,
      email,
      password,
      role,
      shopName,
      location,
      address,
      organizationName,
      organizationType,
      organizationEmail,
    } = value;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Handle file uploads for proof images
    let proofImageUrl = "";
    if (req.file) {
      proofImageUrl = await uploadToCloudinary(req.file.path);
    } else if (role !== "student") {
      return res.status(400).json({ message: "Proof image is required for this role" });
    }

    // Create user object
    const userData = {
      fullName,
      email,
      password,
      role,
    };

    // Add role-specific fields
    if (role === "shop-owner") {
      userData.shopName = shopName;
      userData.location = location;
      userData.proofImage = proofImageUrl;
    } else if (role === "house-owner") {
      userData.address = address;
      userData.roomProofImage = proofImageUrl;
    } else if (role === "education-path") {
      userData.organizationName = organizationName;
      userData.organizationType = organizationType;
      userData.organizationEmail = organizationEmail;
      userData.roleProofImage = proofImageUrl;
    }

    // Create user
    const user = await User.create(userData);

    // Generate response
    const responseMessage = user.role === "student" 
      ? "Registration successful! You can now log in."
      : "Registration successful! Your account is pending admin approval.";

    res.status(201).json({
      message: responseMessage,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: "Validation error", 
        details: error.details[0].message 
      });
    }

    const { email, password } = value;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is approved (except for students and admin)
    if (!user.isApproved && user.role !== "student" && user.role !== "admin") {
      return res.status(403).json({ 
        message: "Your account is pending admin approval",
        status: user.status,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email address" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Save OTP to user
    user.otp = otp;
    user.otpExpire = otpExpiry;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otp, user.fullName);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    res.json({
      message: "OTP sent to your email address",
      email: user.email,
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during password reset request" });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    // Check if OTP is expired
    if (isOTPExpired(user.otpExpire)) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({
      message: "OTP verified successfully",
      email: user.email,
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if OTP is expired
    if (isOTPExpired(user.otpExpire)) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      message: "Password reset successfully. You can now log in with your new password.",
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};