const express = require("express");
const router = express.Router();
const {
  getOwnerRequests,
  getStudentRequests,
  respondToRequest,
  deleteRequest,
} = require("../controllers/roomRequestController");
const { protect, authorize, approvedOnly } = require("../middleware/auth");

// Get all requests (filtered by user role)
router.get(
  "/owner",
  protect,
  authorize("house-owner"),
  approvedOnly,
  getOwnerRequests
);

router.get(
  "/student",
  protect,
  authorize("student"),
  approvedOnly,
  getStudentRequests
);

// Respond to request (owner only)
router.put(
  "/:id/respond",
  protect,
  authorize("house-owner"),
  approvedOnly,
  respondToRequest
);

// Delete/cancel request (student only)
router.delete(
  "/:id",
  protect,
  authorize("student"),
  approvedOnly,
  deleteRequest
);

module.exports = router;
