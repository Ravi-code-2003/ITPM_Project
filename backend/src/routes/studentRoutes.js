const express = require("express");
const { protect, authorize, approvedOnly } = require("../middleware/auth");
const {
  getRestaurants,
  getRestaurantMenu,
  getBudgetMeals,
  createOrder,
  getOrderHistory,
  toggleFavorite,
  getFavorites,
  rateRestaurant,
  getCurrentOffers,
  voteInPoll,
  getPollResults,
  // New enhanced poll methods
  getRestaurantPolls,
  voteInPollProposal
} = require("../controllers/studentController");
const {
  getBudgetSummary,
  generateMonthlyMealPlans,
  getLowBudgetFoods,
  getEndOfMonthAdvice
} = require("../controllers/budgetManagerController");

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('student'));
router.use(approvedOnly);

// Restaurant Discovery Routes
router.get("/restaurants", getRestaurants);
router.get("/restaurant/:id/menu", getRestaurantMenu);

// Smart Features Routes
router.get("/budget-meals", getBudgetMeals);
router.get("/budget-manager/summary", getBudgetSummary);
router.post("/budget-manager/meal-plans", generateMonthlyMealPlans);
router.get("/budget-manager/low-budget-foods", getLowBudgetFoods);
router.post("/budget-manager/end-of-month-advice", getEndOfMonthAdvice);

// Order Routes
router.route("/orders")
  .get(getOrderHistory)
  .post(createOrder);

// Favorites Routes
router.route("/favorites")
  .get(getFavorites)
  .post(toggleFavorite);

// Rating Route
router.post("/rating", rateRestaurant);

// Offers Route
router.get("/offers", getCurrentOffers);

// Poll Routes
router.post("/poll/vote", voteInPoll);
router.get("/poll/:restaurantId", getPollResults);

// Enhanced Poll Routes
router.get("/polls/:restaurantId", getRestaurantPolls);
router.post("/polls/vote-proposal", voteInPollProposal);

module.exports = router;
