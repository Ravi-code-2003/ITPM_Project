const Joi = require("joi");
const budgetService = require("../services/budgetService");

const budgetSchema = Joi.object({
  amount: Joi.number().min(0),
  totalBudget: Joi.number().min(0),
  type: Joi.string().valid("monthly", "weekly").default("monthly"),
}).or("amount", "totalBudget");

const expenseSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  category: Joi.string().min(1).max(80).optional(),
  description: Joi.string().allow("").max(500).optional(),
  date: Joi.date().optional(),
});

const summary = async (req, res) => {
  try {
    const data = await budgetService.calculateRemainingBudget(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Budget summary error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch budget summary" });
  }
};

const mealPlan = async (req, res) => {
  try {
    const plan = await budgetService.getMealPlan(req.user._id, {
      preferences: req.query.preferences || "",
    });
    return res.json({ success: true, data: plan });
  } catch (error) {
    console.error("Meal plan error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate meal plan" });
  }
};

const suggestions = async (req, res) => {
  try {
    const data = await budgetService.getFoodSuggestions(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Suggestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch suggestions" });
  }
};

const insights = async (req, res) => {
  try {
    const data = await budgetService.getInsights(req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Insights error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch insights" });
  }
};

const upsertBudget = async (req, res) => {
  try {
    const { error, value } = budgetSchema.validate(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const data = await budgetService.createOrUpdateBudget(req.user._id, {
      amount: value.amount != null ? value.amount : value.totalBudget,
      type: value.type,
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("Upsert budget error:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this period. Please refresh and try again.",
      });
    }
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? error.message : "Failed to save budget",
    });
  }
};

const createBudget = async (req, res) => upsertBudget(req, res);

const getUserBudget = async (req, res) => {
  try {
    const requestedUserId = String(req.params.userId || "");
    if (requestedUserId && requestedUserId !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const data = await budgetService.getBudgetsByUser(req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Get user budget error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch budgets" });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { error, value } = budgetSchema
      .fork(["type"], (field) => field.optional())
      .validate(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const data = await budgetService.updateBudgetById(req.user._id, req.params.id, {
      amount: value.amount != null ? value.amount : value.totalBudget,
      type: value.type,
    });
    if (!data) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Update budget error:", error);
    return res.status(500).json({ success: false, message: "Failed to update budget" });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const ok = await budgetService.deleteBudgetById(req.user._id, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }
    return res.json({ success: true, message: "Budget deleted" });
  } catch (error) {
    console.error("Delete budget error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete budget" });
  }
};

const addExpense = async (req, res) => {
  try {
    const { error, value } = expenseSchema.validate(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const data = await budgetService.createExpense(req.user._id, {
      amount: value.amount,
      category: value.category || "Food",
      description: value.description || "",
      date: value.date,
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("Add expense error:", error);
    return res.status(500).json({ success: false, message: "Failed to add expense" });
  }
};

const expenses = async (req, res) => {
  try {
    const data = await budgetService.listExpenses(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("List expenses error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch expenses" });
  }
};

const editExpense = async (req, res) => {
  try {
    const { error, value } = expenseSchema.fork(["amount"], (field) => field.optional()).validate(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const data = await budgetService.updateExpense(req.user._id, req.params.id, value);
    if (!data) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Update expense error:", error);
    return res.status(500).json({ success: false, message: "Failed to update expense" });
  }
};

const removeExpense = async (req, res) => {
  try {
    const ok = await budgetService.deleteExpense(req.user._id, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    return res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete expense" });
  }
};

const progression = async (req, res) => {
  try {
    const range = req.query.range === "weekly" ? "weekly" : "monthly";
    const data = await budgetService.getProgression(req.user._id, {
      range,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Progression error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch progression data" });
  }
};

module.exports = {
  summary,
  mealPlan,
  suggestions,
  insights,
  upsertBudget,
  createBudget,
  getUserBudget,
  updateBudget,
  deleteBudget,
  addExpense,
  expenses,
  editExpense,
  removeExpense,
  progression,
};
