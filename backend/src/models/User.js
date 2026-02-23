const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Common fields for all users
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ["student", "shop-owner", "house-owner", "education-path", "admin"],
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.role === "student" || this.role === "admin";
    }
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: function() {
      return (this.role === "student" || this.role === "admin") ? "approved" : "pending";
    }
  },

  // OTP fields for password reset
  otp: String,
  otpExpire: Date,

  // Shop Owner specific fields
  shopName: {
    type: String,
    required: function() { return this.role === "shop-owner"; }
  },
  location: {
    type: String,
    required: function() { return this.role === "shop-owner"; }
  },
  proofImage: {
    type: String, // Cloudinary URL
    required: false
  },

  // House Owner specific fields
  address: {
    type: String,
    required: function() { return this.role === "house-owner"; }
  },
  roomProofImage: {
    type: String, // Cloudinary URL
    required: false
  },

  // Education Path specific fields
  organizationName: {
    type: String,
    required: function() { return this.role === "education-path"; }
  },
  organizationType: {
    type: String,
    enum: ["club", "company", "NGO", "institute", "university-group"],
    required: function() { return this.role === "education-path"; }
  },
  organizationEmail: {
    type: String,
    required: function() { return this.role === "education-path"; }
  },
  roleProofImage: {
    type: String, // Cloudinary URL
    required: false
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash password before saving and update timestamps
userSchema.pre("save", async function () {
  // Update timestamp always
  this.updatedAt = Date.now();
  
  // Only hash password if it's modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;