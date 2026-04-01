const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const FoodItem = require("../models/FoodItem");
const Rating = require("../models/Rating");
const MemoryCache = require("./cache/MemoryCache");
const aiService = require("./aiService");

const mealPlanCache = new MemoryCache({ defaultTtlMs: 1000 * 60 * 60 * 24 * 7 });
const suggestionCache = new MemoryCache({ defaultTtlMs: 1000 * 60 * 60 });

const normalizePagination = (page, limit) => {
  const pageNum = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
  return { page: pageNum, limit: pageSize, skip: (pageNum - 1) * pageSize };
};

const resolveBudgetAmount = (budgetDoc) => {
  if (!budgetDoc) return 0;
  return Number(
    budgetDoc.amount != null
      ? budgetDoc.amount
      : budgetDoc.totalBudget != null
        ? budgetDoc.totalBudget
        : 0
  );
};

const getPeriodRange = (type = "monthly") => {
  const now = new Date();
  if (type === "weekly") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - diffToMonday);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

const getActiveBudget = async (userId) => {
  const now = new Date();
  return Budget.findOne({
    userId,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ endDate: -1, createdAt: -1 })
    .select("amount totalBudget type startDate endDate")
    .lean();
};

const getLatestBudget = async (userId) => {
  return Budget.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("amount totalBudget type startDate endDate")
    .lean();
};

const createOrUpdateBudget = async (userId, { amount, type }) => {
  const budgetType = type === "weekly" ? "weekly" : "monthly";
  const { startDate, endDate } = getPeriodRange(budgetType);
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
    const inputError = new Error("Invalid budget amount");
    inputError.statusCode = 400;
    throw inputError;
  }
  const payload = {
    userId,
    amount: normalizedAmount,
    totalBudget: normalizedAmount,
    type: budgetType,
    startDate,
    endDate,
  };

  const periodOverlapQuery = {
    userId,
    type: budgetType,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  // First, try to update an existing budget for this period/type.
  let budget = await Budget.findOneAndUpdate(periodOverlapQuery, payload, { returnDocument: "after" })
    .select("amount totalBudget type startDate endDate")
    .lean();

  // If no overlapping budget exists, create one.
  if (!budget) {
    try {
      budget = await Budget.create({
        userId,
        amount: normalizedAmount,
        totalBudget: normalizedAmount,
        type: budgetType,
        startDate,
        endDate,
      });
      return {
        amount: budget.amount,
        totalBudget: resolveBudgetAmount(budget),
        type: budget.type,
        startDate: budget.startDate,
        endDate: budget.endDate,
      };
    } catch (error) {
      // Handle race condition / legacy unique index collisions gracefully.
      if (error?.code === 11000) {
        budget = await Budget.findOneAndUpdate(
          { userId, type: budgetType },
          payload,
          { returnDocument: "after", sort: { createdAt: -1 } }
        )
          .select("amount totalBudget type startDate endDate")
          .lean();
        if (!budget) {
          budget = await Budget.findOneAndUpdate(
            { userId },
            payload,
            { returnDocument: "after", sort: { createdAt: -1 } }
          )
            .select("amount totalBudget type startDate endDate")
            .lean();
        }
      } else {
        throw error;
      }
    }
  }

  return budget;
};

const getBudgetsByUser = async (userId) => {
  const budgets = await Budget.find({ userId })
    .sort({ createdAt: -1 })
    .select("amount totalBudget type startDate endDate createdAt updatedAt")
    .lean();

  return {
    latest: budgets[0]
      ? {
          id: budgets[0]._id,
          totalBudget: resolveBudgetAmount(budgets[0]),
          amount: resolveBudgetAmount(budgets[0]),
          type: budgets[0].type,
          startDate: budgets[0].startDate,
          endDate: budgets[0].endDate,
          createdAt: budgets[0].createdAt,
          updatedAt: budgets[0].updatedAt,
        }
      : null,
    items: budgets.map((b) => ({
      id: b._id,
      totalBudget: resolveBudgetAmount(b),
      amount: resolveBudgetAmount(b),
      type: b.type,
      startDate: b.startDate,
      endDate: b.endDate,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  };
};

const updateBudgetById = async (userId, budgetId, payload = {}) => {
  const update = {};
  if (payload.amount != null) {
    update.amount = Number(payload.amount);
    update.totalBudget = Number(payload.amount);
  }
  if (payload.type != null) {
    update.type = payload.type === "weekly" ? "weekly" : "monthly";
    const period = getPeriodRange(update.type);
    update.startDate = period.startDate;
    update.endDate = period.endDate;
  }

  const budget = await Budget.findOneAndUpdate({ _id: budgetId, userId }, update, {
    returnDocument: "after",
  })
    .select("amount totalBudget type startDate endDate createdAt updatedAt")
    .lean();

  if (!budget) return null;

  return {
    id: budget._id,
    totalBudget: resolveBudgetAmount(budget),
    amount: resolveBudgetAmount(budget),
    type: budget.type,
    startDate: budget.startDate,
    endDate: budget.endDate,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
};

const deleteBudgetById = async (userId, budgetId) => {
  const deleted = await Budget.findOneAndDelete({ _id: budgetId, userId }).select("_id").lean();
  return Boolean(deleted);
};

const calculateRemainingBudget = async (userId, { page = 1, limit = 10 } = {}) => {
  const activeBudget = await getActiveBudget(userId);
  const budgetForSummary = activeBudget || (await getLatestBudget(userId));
  if (!budgetForSummary) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      budgetType: null,
      expenses: [],
      pagination: normalizePagination(page, limit),
    };
  }

  const { page: pageNum, limit: pageSize, skip } = normalizePagination(page, limit);

  const [expenseAgg, expenses] = await Promise.all([
    Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: budgetForSummary.startDate, $lte: budgetForSummary.endDate },
        },
      },
      { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
    ]),
    Expense.find({
      userId,
      date: { $gte: budgetForSummary.startDate, $lte: budgetForSummary.endDate },
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("amount category description date")
      .lean(),
  ]);

  const totalSpent = Number(expenseAgg[0]?.totalSpent || 0);
  const totalBudget = resolveBudgetAmount(budgetForSummary);

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    budgetType: budgetForSummary.type,
    expenses,
    pagination: { page: pageNum, limit: pageSize },
  };
};

const getMealPlan = async (userId, preferences = {}) => {
  const summary = await calculateRemainingBudget(userId, { page: 1, limit: 1 });
  const budget = Math.max(summary.remaining, 0);
  const periodKey = `${summary.budgetType || "none"}:${new Date().toISOString().slice(0, 7)}`;
  const cacheKey = `mealplan:${userId}:${periodKey}`;
  const cached = mealPlanCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const affordableItems = await FoodItem.find({
    status: "Available",
    price: { $lte: Math.max(100, Math.floor(budget / 20) || 100) },
  })
    .sort({ price: 1 })
    .limit(24)
    .select("name price category")
    .lean();

  const plan = await aiService.generateMealPlan(budget, {
    ...preferences,
    userId,
    affordableItems,
    budgetType: summary.budgetType,
  });

  mealPlanCache.set(cacheKey, plan);
  return { ...plan, cached: false };
};

const getFoodSuggestions = async (userId, { page = 1, limit = 10 } = {}) => {
  const summary = await calculateRemainingBudget(userId, { page: 1, limit: 1 });
  const { page: pageNum, limit: pageSize, skip } = normalizePagination(page, limit);
  const cacheKey = `suggestions:${userId}:${summary.budgetType || "none"}:${pageNum}:${pageSize}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const activeBudget = await getActiveBudget(userId);
  if (!activeBudget) return { suggestions: [], cached: false, pagination: { page: pageNum, limit: pageSize } };

  const categoryAgg = await Expense.aggregate([
    { $match: { userId, date: { $gte: activeBudget.startDate, $lte: activeBudget.endDate } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const freqMap = new Map(categoryAgg.map((c) => [String(c._id || "").toLowerCase(), c.count]));
  const maxFreq = Math.max(...categoryAgg.map((c) => c.count), 1);

  const maxPrice = Math.max(100, Math.floor(Math.max(summary.remaining, 0) / 15));
  const items = await FoodItem.find({ status: "Available", price: { $lte: maxPrice } })
    .sort({ price: 1 })
    .skip(skip)
    .limit(pageSize)
    .select("_id name price category restaurantId")
    .lean();

  const restaurantIds = [...new Set(items.map((i) => String(i.restaurantId)).filter(Boolean))];
  const ratingRows = await Rating.aggregate([
    { $match: { restaurantId: { $in: restaurantIds } } },
    { $group: { _id: "$restaurantId", avgRating: { $avg: "$rating" } } },
  ]);
  const ratingMap = new Map(ratingRows.map((r) => [String(r._id), Number(r.avgRating || 0)]));
  const minPrice = items.length ? Math.min(...items.map((i) => i.price)) : 0;
  const maxFoundPrice = items.length ? Math.max(...items.map((i) => i.price)) : 1;

  const suggestions = items
    .map((item) => {
      const affordability = 1 - ((item.price - minPrice) / Math.max(maxFoundPrice - minPrice, 1));
      const frequency =
        (freqMap.get(String(item.category || "").toLowerCase()) || 0) / maxFreq;
      const rating = (ratingMap.get(String(item.restaurantId)) || 0) / 5;
      const score = Number((affordability + frequency + rating).toFixed(4));
      return {
        id: item._id,
        name: item.name,
        category: item.category,
        price: item.price,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const result = {
    suggestions,
    pagination: { page: pageNum, limit: pageSize },
    cached: false,
  };
  suggestionCache.set(cacheKey, result);
  return result;
};

const getInsights = async (userId) => {
  const activeBudget = await getActiveBudget(userId);
  const budgetForInsights = activeBudget || (await getLatestBudget(userId));
  if (!budgetForInsights) {
    return {
      savingTips: ["Set a weekly or monthly budget to start tracking effectively."],
      investmentSuggestions: ["Build an emergency fund before investing."],
      topCategories: [],
    };
  }

  const [summaryAgg, categoryAgg] = await Promise.all([
    Expense.aggregate([
      { $match: { userId, date: { $gte: budgetForInsights.startDate, $lte: budgetForInsights.endDate } } },
      { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: budgetForInsights.startDate, $lte: budgetForInsights.endDate } } },
      { $group: { _id: "$category", totalSpent: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalSpent = Number(summaryAgg[0]?.totalSpent || 0);
  const remaining = resolveBudgetAmount(budgetForInsights) - totalSpent;
  const topCategories = categoryAgg.map((c) => ({
    category: c._id,
    totalSpent: c.totalSpent,
    count: c.count,
  }));

  const biggestCategory = topCategories[0]?.category || "non-essential";
  const savingTips = [
    `Review ${biggestCategory} spending and target a 10% cut next period.`,
    remaining < 0
      ? "You are over budget. Use a strict category cap for the next cycle."
      : "Automate savings of at least 15% of your remaining budget.",
  ];
  const investmentSuggestions = [
    remaining > 5000
      ? "Put part of your surplus in a low-risk fixed deposit."
      : "Build emergency cash before starting new investments.",
    "Track monthly consistency before increasing risk exposure.",
  ];

  return { savingTips, investmentSuggestions, topCategories };
};

const createExpense = async (userId, { amount, category, description, date }) => {
  const expense = await Expense.create({
    userId,
    amount: Number(amount),
    category: String(category || "Food").trim(),
    description: String(description || "").trim(),
    date: date ? new Date(date) : new Date(),
  });

  return {
    id: expense._id,
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  };
};

const listExpenses = async (userId, { page = 1, limit = 10 } = {}) => {
  const { page: pageNum, limit: pageSize, skip } = normalizePagination(page, limit);
  const [rows, total] = await Promise.all([
    Expense.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("amount category description date")
      .lean(),
    Expense.countDocuments({ userId }),
  ]);

  return {
    expenses: rows.map((e) => ({
      id: e._id,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
    })),
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

const updateExpense = async (userId, expenseId, payload = {}) => {
  const update = {};
  if (payload.amount != null) update.amount = Number(payload.amount);
  if (payload.category != null) update.category = String(payload.category).trim();
  if (payload.description != null) update.description = String(payload.description).trim();
  if (payload.date != null) update.date = new Date(payload.date);

  const expense = await Expense.findOneAndUpdate({ _id: expenseId, userId }, update, {
    returnDocument: "after",
  })
    .select("amount category description date")
    .lean();

  if (!expense) return null;

  return {
    id: expense._id,
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  };
};

const deleteExpense = async (userId, expenseId) => {
  const deleted = await Expense.findOneAndDelete({ _id: expenseId, userId }).select("_id").lean();
  return Boolean(deleted);
};

const getProgression = async (userId, { range = "monthly", page = 1, limit = 12 } = {}) => {
  const { page: pageNum, limit: pageSize } = normalizePagination(page, limit);
  const budgetType = range === "weekly" ? "weekly" : "monthly";
  const budgets = await Budget.find({ userId, type: budgetType })
    .sort({ startDate: 1 })
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .select("amount startDate endDate")
    .lean();

  const points = await Promise.all(
    budgets.map(async (budget) => {
      const spentAgg = await Expense.aggregate([
        {
          $match: {
            userId,
            date: { $gte: budget.startDate, $lte: budget.endDate },
          },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);
      const totalSpent = Number(spentAgg[0]?.totalSpent || 0);
      const totalBudget = Number(budget.amount || 0);
      return {
        periodStart: budget.startDate,
        periodEnd: budget.endDate,
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
      };
    })
  );

  const trend = points.map((point) => ({
    date: point.periodStart,
    balance: point.remaining,
  }));

  return { range: budgetType, points, trend, pagination: { page: pageNum, limit: pageSize } };
};

module.exports = {
  createOrUpdateBudget,
  getBudgetsByUser,
  updateBudgetById,
  deleteBudgetById,
  calculateRemainingBudget,
  getMealPlan,
  getFoodSuggestions,
  getInsights,
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
  getProgression,
};
