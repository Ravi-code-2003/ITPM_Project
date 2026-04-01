const express = require("express");
const { protect, authorize, approvedOnly } = require("../middleware/auth");
const budgetController = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);
router.use(authorize("student"));
router.use(approvedOnly);

router.post("/", budgetController.upsertBudget);
router.post("/expenses", budgetController.addExpense);
router.get("/expenses", budgetController.expenses);
router.patch("/expenses/:id", budgetController.editExpense);
router.delete("/expenses/:id", budgetController.removeExpense);
router.get("/summary", budgetController.summary);
router.get("/meal-plan", budgetController.mealPlan);
router.get("/suggestions", budgetController.suggestions);
router.get("/insights", budgetController.insights);
router.get("/progression", budgetController.progression);
router.get("/:userId", budgetController.getUserBudget);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

module.exports = router;
