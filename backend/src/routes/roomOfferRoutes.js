const express = require("express");
const router = express.Router();
const {
  getMyOffers,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
} = require("../controllers/roomOfferController");
const { protect, authorize, approvedOnly } = require("../middleware/auth");

// Get all offers for owner's rooms
router.get(
  "/my-offers",
  protect,
  authorize("house-owner"),
  approvedOnly,
  getMyOffers
);

// Update offer
router.put(
  "/:id",
  protect,
  authorize("house-owner"),
  approvedOnly,
  updateOffer
);

// Toggle offer active status
router.patch(
  "/:id/toggle",
  protect,
  authorize("house-owner"),
  approvedOnly,
  toggleOfferStatus
);

// Delete offer
router.delete(
  "/:id",
  protect,
  authorize("house-owner"),
  approvedOnly,
  deleteOffer
);

module.exports = router;
