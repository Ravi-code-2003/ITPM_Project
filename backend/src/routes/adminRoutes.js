const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getPendingUsers,
  getUserById,
  approveUser,
  rejectUser,
  deleteUser,
  getDashboardStats,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard routes
router.get("/dashboard-stats", getDashboardStats);

// User management routes
router.get("/users", getAllUsers);
router.get("/pending-users", getPendingUsers);
router.get("/users/:id", getUserById);

// User approval routes
router.put("/approve-user/:id", approveUser);
router.put("/reject-user/:id", rejectUser);
router.delete("/delete-user/:id", deleteUser);

module.exports = router;