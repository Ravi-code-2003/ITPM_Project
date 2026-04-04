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
  getAllComboMeals,
  voteInPoll,
  getPollResults,
  getBudgetTracker,
  getStudentFinanceProfile,
  updateStudentFinanceProfile,
  // New enhanced poll methods
  getRestaurantPolls,
  voteInPollProposal
} = require("../controllers/studentController");
const {
  getStudyTrackerSessions,
  createStudySession,
} = require("../controllers/studyTrackerController");
const {
  getStudentTimetable,
  createTimetableItem,
  updateTimetableItem,
  deleteTimetableItem,
} = require("../controllers/studyTimetableController");
const {
  getStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
} = require("../controllers/stickyNotesController");
const {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodoCompletion,
  deleteTodo,
} = require("../controllers/todoController");
const {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
  respondToLostFoundItem,
  resolveLostFoundItem,
} = require("../controllers/lostFoundController");
const { upload } = require("../utils/upload");

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
router.get("/budget-tracker", getBudgetTracker);
router.get("/finance-profile", getStudentFinanceProfile);
router.put("/finance-profile", updateStudentFinanceProfile);

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

// Combo Meals Route
router.get("/combos", getAllComboMeals);

// Poll Routes
router.post("/poll/vote", voteInPoll);
router.get("/poll/:restaurantId", getPollResults);

// Enhanced Poll Routes
router.get("/polls/:restaurantId", getRestaurantPolls);
router.post("/polls/vote-proposal", voteInPollProposal);

// Study Tracker Routes
router.route("/study-tracker")
  .get(getStudyTrackerSessions)
  .post(createStudySession);

// Study Timetable Routes
router.route("/timetable")
  .get(getStudentTimetable)
  .post(createTimetableItem);

router.route("/timetable/:id")
  .patch(updateTimetableItem)
  .delete(deleteTimetableItem);

// Sticky Notes Routes
router.route("/sticky-notes")
  .get(getStickyNotes)
  .post(createStickyNote);

router.route("/sticky-notes/:id")
  .patch(updateStickyNote)
  .delete(deleteStickyNote);

// Todo Routes
router.route("/todos")
  .get(getTodos)
  .post(createTodo);

router.route("/todos/:id")
  .patch(updateTodo)
  .delete(deleteTodo);

router.route("/todos/:id/toggle")
  .patch(toggleTodoCompletion);

// Lost & Found Routes
router.route("/lost-found")
  .get(getLostFoundItems)
  .post(upload.single("image"), createLostFoundItem);

router.route("/lost-found/:id")
  .patch(upload.single("image"), updateLostFoundItem)
  .delete(deleteLostFoundItem);

router.route("/lost-found/:id/respond")
  .post(respondToLostFoundItem);

router.route("/lost-found/:id/resolve/:responseId")
  .patch(resolveLostFoundItem);

module.exports = router;