const User = require("../models/User");
const { sendApprovalEmail, sendRejectionEmail } = require("../utils/emailService");

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Build filter query
    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const users = await User.find(filter)
      .select("-password -otp -otpExpire")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get counts for dashboard stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    const roleCounts = {
      student: 0,
      "shop-owner": 0,
      "house-owner": 0,
      "education-path": 0,
      admin: 0,
    };

    stats.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    roleStats.forEach(item => {
      roleCounts[item._id] = item.count;
    });

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      stats: {
        total,
        byStatus: statusCounts,
        byRole: roleCounts,
      },
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};

// @desc    Get pending users
// @route   GET /api/admin/pending-users
// @access  Private/Admin
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      status: "pending",
      role: { $ne: "admin" } 
    })
    .select("-password -otp -otpExpire")
    .sort({ createdAt: -1 });

    res.json({
      pendingUsers,
      count: pendingUsers.length,
    });

  } catch (error) {
    console.error("Get pending users error:", error);
    res.status(500).json({ message: "Server error while fetching pending users" });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp -otpExpire");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });

  } catch (error) {
    console.error("Get user by ID error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    res.status(500).json({ message: "Server error while fetching user" });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/approve-user/:id
// @access  Private/Admin
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "approved") {
      return res.status(400).json({ message: "User is already approved" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot modify admin user status" });
    }

    // Update user status
    user.status = "approved";
    user.isApproved = true;
    await user.save();

    // Send approval email
    const emailSent = await sendApprovalEmail(user.email, user.fullName, user.role);

    if (!emailSent) {
      console.warn(`Failed to send approval email to ${user.email}`);
    }

    res.json({
      message: "User approved successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved,
      },
      emailSent,
    });

  } catch (error) {
    console.error("Approve user error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    res.status(500).json({ message: "Server error while approving user" });
  }
};

// @desc    Reject user
// @route   PUT /api/admin/reject-user/:id
// @access  Private/Admin
const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "rejected") {
      return res.status(400).json({ message: "User is already rejected" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot modify admin user status" });
    }

    // Update user status
    user.status = "rejected";
    user.isApproved = false;
    await user.save();

    // Send rejection email
    const emailSent = await sendRejectionEmail(user.email, user.fullName, user.role);

    if (!emailSent) {
      console.warn(`Failed to send rejection email to ${user.email}`);
    }

    res.json({
      message: "User rejected successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved,
      },
      emailSent,
    });

  } catch (error) {
    console.error("Reject user error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    res.status(500).json({ message: "Server error while rejecting user" });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/delete-user/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin user" });
    }

    // Store user info before deletion for response
    const deletedUserInfo = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "User deleted successfully",
      deletedUser: deletedUserInfo,
    });

  } catch (error) {
    console.error("Delete user error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get counts by status
    const statusStats = await User.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Format stats
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    const roleCounts = {
      student: 0,
      "shop-owner": 0,
      "house-owner": 0,
      "education-path": 0,
      admin: 0,
    };

    statusStats.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    roleStats.forEach(item => {
      roleCounts[item._id] = item.count;
    });

    res.json({
      totalUsers,
      recentRegistrations,
      statusCounts,
      roleCounts,
      pendingApprovals: statusCounts.pending,
    });

  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Server error while fetching dashboard stats" });
  }
};

module.exports = {
  getAllUsers,
  getPendingUsers,
  getUserById,
  approveUser,
  rejectUser,
  deleteUser,
  getDashboardStats,
};