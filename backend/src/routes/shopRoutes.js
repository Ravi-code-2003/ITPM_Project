const express = require("express");
const { protect, authorize, approvedOnly } = require("../middleware/auth");
const {
  getRestaurant,
  getFoods,
  createFood,
  updateFood,
  deleteFood,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo,
  getOrders,
  updateOrderStatus,
  getAnalytics,
  getPolls,
  publishOfferFromPoll,
  // New poll management methods
  createPoll,
  getPollsWithProposals,
  updatePollStatus,
  createOfferFromPoll,
  deletePoll
} = require("../controllers/shopController");

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('shop-owner'));
router.use(approvedOnly);

// Restaurant Profile Route
router.get("/restaurant", getRestaurant);

// Food Items Routes
router.route("/foods")
  .get(getFoods)
  .post(createFood);

router.route("/foods/:id")
  .put(updateFood)
  .delete(deleteFood);

// Offers Routes
router.route("/offers")
  .get(getOffers)
  .post(createOffer);

router.route("/offers/:id")
  .put(updateOffer)
  .delete(deleteOffer);

// Combo Meals Routes
router.route("/combos")
  .get(getCombos)
  .post(createCombo);

router.route("/combos/:id")
  .put(updateCombo)
  .delete(deleteCombo);

// Orders Routes
router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Analytics Route
router.get("/analytics", getAnalytics);

// Poll Routes
router.get("/polls", getPolls);
router.post("/polls/:pollId/publish-offer", publishOfferFromPoll);

// Enhanced Poll Management Routes
router.route("/polls-new")
  .get(getPollsWithProposals)
  .post(createPoll);

router.route("/polls/:id")
  .delete(deletePoll);

router.put("/polls/:id/status", updatePollStatus);
router.post("/polls/:id/create-offer", createOfferFromPoll);

module.exports = router;