const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const ComboMeal = require("../models/ComboMeal");
const Offer = require("../models/Offer");
const Order = require("../models/Order");
const Todo = require("../models/Todo");
const StickyNote = require("../models/StickyNote");
const StudySession = require("../models/StudySession");
const StudyTimetable = require("../models/StudyTimetable");
const LostFoundItem = require("../models/LostFoundItem");
const StudentFinanceProfile = require("../models/StudentFinanceProfile");
const EducationProgram = require("../models/EducationProgram");

const AI_DB_CONTEXT_MAX_ITEMS = parseInt(process.env.AI_DB_CONTEXT_MAX_ITEMS, 10) || 20;

const FOOD_KEYWORDS = [
  "food",
  "eat",
  "meal",
  "restaurant",
  "canteen",
  "shop",
  "snack",
  "drink",
];

const ACCOMMODATION_KEYWORDS = [
  "accommodation",
  "room",
  "rent",
  "house",
  "hostel",
  "boarding",
  "stay",
  "lodging",
];

const PRODUCTIVITY_KEYWORDS = ["todo", "task", "note", "sticky", "productivity", "reminder"];
const STUDY_KEYWORDS = ["study", "session", "focus", "timetable", "module", "exam"];
const ORDER_KEYWORDS = ["order", "orders", "purchase", "bought", "pending", "delivery", "pickup"];
const FINANCE_KEYWORDS = ["budget", "money", "finance", "expense", "spend", "saving"];
const LOST_FOUND_KEYWORDS = ["lost", "found", "item", "campus", "missing"];
const EDUCATION_KEYWORDS = ["program", "course", "education", "learning", "material", "lecture"];

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const includesAny = (text, keywords) => {
  const lower = String(text || "").toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
};

const parseBudgetFromMessage = (text) => {
  const normalized = String(text || "").replace(/,/g, "");
  const budgetMatch = normalized.match(/(?:lkr|rs\.?|budget|under|below|<=?)\s*(\d+(?:\.\d+)?)/i);
  if (budgetMatch?.[1]) {
    return Number(budgetMatch[1]);
  }

  const fallbackMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (fallbackMatch?.[1]) {
    return Number(fallbackMatch[1]);
  }

  return null;
};

const scoreRecord = (queryTokens, fields) => {
  const haystack = fields.join(" ").toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (token.length > 1 && haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
};

const rankAndLimit = (items, query) => {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return items.slice(0, AI_DB_CONTEXT_MAX_ITEMS);
  }

  return items
    .map((item) => ({
      item,
      score: scoreRecord(tokens, [item.name, item.location, item.address]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_DB_CONTEXT_MAX_ITEMS)
    .map((entry) => entry.item);
};

const buildRequestedModules = (message) => {
  const wantsEverything = includesAny(message, ["all", "everything", "database", "system"]);

  return {
    wantsEverything,
    needsFood: wantsEverything || includesAny(message, FOOD_KEYWORDS),
    needsAccommodation: wantsEverything || includesAny(message, ACCOMMODATION_KEYWORDS),
    needsProductivity: wantsEverything || includesAny(message, PRODUCTIVITY_KEYWORDS),
    needsStudy: wantsEverything || includesAny(message, STUDY_KEYWORDS),
    needsOrders: wantsEverything || includesAny(message, ORDER_KEYWORDS),
    needsFinance: wantsEverything || includesAny(message, FINANCE_KEYWORDS),
    needsLostFound: wantsEverything || includesAny(message, LOST_FOUND_KEYWORDS),
    needsEducation: wantsEverything || includesAny(message, EDUCATION_KEYWORDS),
  };
};

const getLimited = (value) => value.slice(0, AI_DB_CONTEXT_MAX_ITEMS);

const fetchStudentFoodContext = async (message) => {
  const budget = parseBudgetFromMessage(message);
  const foodQuery = { status: "Available" };
  const comboQuery = { status: "Available" };

  if (Number.isFinite(budget) && budget > 0) {
    foodQuery.price = { $lte: budget };
    comboQuery.totalPrice = { $lte: budget };
  }

  const [restaurants, foodItems, comboMeals, offers] = await Promise.all([
    Restaurant.find({}).select("shopName location").sort({ shopName: 1 }).limit(AI_DB_CONTEXT_MAX_ITEMS).lean(),
    FoodItem.find(foodQuery)
      .populate("restaurantId", "shopName location")
      .select("name price category restaurantId")
      .sort({ price: 1 })
      .limit(AI_DB_CONTEXT_MAX_ITEMS)
      .lean(),
    ComboMeal.find(comboQuery)
      .populate("restaurantId", "shopName location")
      .select("name totalPrice restaurantId")
      .sort({ totalPrice: 1 })
      .limit(AI_DB_CONTEXT_MAX_ITEMS)
      .lean(),
    Offer.find({ isActive: true, validDate: { $gte: new Date() } })
      .populate("restaurantId", "shopName location")
      .populate("foodItemId", "name price category")
      .select("discountPercent validDate restaurantId foodItemId")
      .sort({ validDate: 1 })
      .limit(AI_DB_CONTEXT_MAX_ITEMS)
      .lean(),
  ]);

  return {
    budget,
    restaurants: getLimited(
      restaurants.map((item) => ({
        name: item.shopName || "",
        location: item.location || "",
      }))
    ),
    foodItems: getLimited(
      foodItems.map((item) => ({
        name: item.name,
        price: item.price,
        category: item.category,
        restaurant: item.restaurantId?.shopName || "",
        location: item.restaurantId?.location || "",
      }))
    ),
    comboMeals: getLimited(
      comboMeals.map((item) => ({
        name: item.name,
        totalPrice: item.totalPrice,
        restaurant: item.restaurantId?.shopName || "",
        location: item.restaurantId?.location || "",
      }))
    ),
    offers: getLimited(
      offers.map((item) => ({
        foodName: item.foodItemId?.name || "",
        basePrice: item.foodItemId?.price ?? null,
        discountPercent: item.discountPercent,
        restaurant: item.restaurantId?.shopName || "",
        validDate: item.validDate,
      }))
    ),
  };
};

const fetchStudentProductivityContext = async (studentId) => {
  const [todos, notes] = await Promise.all([
    Todo.find({ studentId }).select("title completed priority dueDate").sort({ createdAt: -1 }).limit(AI_DB_CONTEXT_MAX_ITEMS).lean(),
    StickyNote.find({ studentId }).select("title content color updatedAt").sort({ updatedAt: -1 }).limit(AI_DB_CONTEXT_MAX_ITEMS).lean(),
  ]);

  return {
    todos: todos.map((item) => ({
      title: item.title,
      completed: item.completed,
      priority: item.priority,
      dueDate: item.dueDate,
    })),
    stickyNotes: notes.map((item) => ({
      title: item.title,
      content: item.content,
      color: item.color,
      updatedAt: item.updatedAt,
    })),
  };
};

const fetchStudentStudyContext = async (studentId) => {
  const [sessions, timetable] = await Promise.all([
    StudySession.find({ studentId })
      .select("startedAt endedAt durationMs pauseCount")
      .sort({ startedAt: -1 })
      .limit(AI_DB_CONTEXT_MAX_ITEMS)
      .lean(),
    StudyTimetable.find({ studentId })
      .select("moduleName plannedHours day completed")
      .sort({ day: 1, moduleName: 1 })
      .limit(AI_DB_CONTEXT_MAX_ITEMS)
      .lean(),
  ]);

  return {
    sessions: sessions.map((item) => ({
      startedAt: item.startedAt,
      endedAt: item.endedAt,
      durationMs: item.durationMs,
      pauseCount: item.pauseCount,
    })),
    timetable: timetable.map((item) => ({
      moduleName: item.moduleName,
      plannedHours: item.plannedHours,
      day: item.day,
      completed: item.completed,
    })),
  };
};

const fetchStudentOrdersContext = async (studentId) => {
  const rows = await Order.find({ studentId })
    .populate("restaurantId", "shopName")
    .select("orderNumber status totalAmount createdAt restaurantId")
    .sort({ createdAt: -1 })
    .limit(AI_DB_CONTEXT_MAX_ITEMS)
    .lean();

  return rows.map((item) => ({
    orderNumber: item.orderNumber,
    status: item.status,
    totalAmount: item.totalAmount,
    restaurant: item.restaurantId?.shopName || "",
    createdAt: item.createdAt,
  }));
};

const fetchStudentFinanceContext = async (studentId) => {
  const profile = await StudentFinanceProfile.findOne({ studentId })
    .select("monthlyBudget expenseCategories")
    .lean();

  if (!profile) {
    return null;
  }

  return {
    monthlyBudget: profile.monthlyBudget || 0,
    expenseCategories: Array.isArray(profile.expenseCategories)
      ? profile.expenseCategories.map((item) => ({
          key: item.key,
          label: item.label,
          percent: item.percent,
        }))
      : [],
  };
};

const fetchLostFoundContext = async () => {
  const rows = await LostFoundItem.find({ status: "open" })
    .select("itemName category campus locationDetails lostDate")
    .sort({ createdAt: -1 })
    .limit(AI_DB_CONTEXT_MAX_ITEMS)
    .lean();

  return rows.map((item) => ({
    itemName: item.itemName,
    category: item.category,
    campus: item.campus,
    locationDetails: item.locationDetails,
    lostDate: item.lostDate,
  }));
};

const fetchEducationContext = async () => {
  const rows = await EducationProgram.find({ isActive: true })
    .select("title category provider level price rating")
    .sort({ rating: -1, students: -1 })
    .limit(AI_DB_CONTEXT_MAX_ITEMS)
    .lean();

  return rows.map((item) => ({
    title: item.title,
    category: item.category,
    provider: item.provider,
    level: item.level,
    price: item.price,
    rating: item.rating,
  }));
};

const fetchApprovedFoodProviders = async () => {
  const rows = await User.find({
    role: "shop-owner",
    status: "approved",
    isApproved: true,
  })
    .select("fullName email shopName location")
    .lean();

  return rows.map((row) => ({
    name: row.shopName || row.fullName || "Unnamed Food Provider",
    ownerName: row.fullName || "",
    contactEmail: row.email || "",
    location: row.location || "",
    category: "food",
  }));
};

const fetchApprovedAccommodationProviders = async () => {
  const rows = await User.find({
    role: "house-owner",
    status: "approved",
    isApproved: true,
  })
    .select("fullName email address")
    .lean();

  return rows.map((row) => ({
    name: row.fullName || "Unnamed House Owner",
    ownerName: row.fullName || "",
    contactEmail: row.email || "",
    address: row.address || "",
    category: "accommodation",
  }));
};

const buildDatabaseContext = async (userMessage, user = null) => {
  const message = String(userMessage || "");
  const requested = buildRequestedModules(message);
  const needsFood = requested.needsFood;
  const needsAccommodation = requested.needsAccommodation;

  if (
    !needsFood &&
    !needsAccommodation &&
    !requested.needsProductivity &&
    !requested.needsStudy &&
    !requested.needsOrders &&
    !requested.needsFinance &&
    !requested.needsLostFound &&
    !requested.needsEducation
  ) {
    return null;
  }

  const isStudent = user?.role === "student" && user?._id;

  if (isStudent) {
    const studentId = user._id;
    const [foodContext, accommodationRows, productivity, study, orders, finance, lostFound, education] =
      await Promise.all([
        needsFood ? fetchStudentFoodContext(message) : Promise.resolve(null),
        needsAccommodation ? fetchApprovedAccommodationProviders() : Promise.resolve([]),
        requested.needsProductivity ? fetchStudentProductivityContext(studentId) : Promise.resolve(null),
        requested.needsStudy ? fetchStudentStudyContext(studentId) : Promise.resolve(null),
        requested.needsOrders ? fetchStudentOrdersContext(studentId) : Promise.resolve([]),
        requested.needsFinance ? fetchStudentFinanceContext(studentId) : Promise.resolve(null),
        requested.needsLostFound ? fetchLostFoundContext() : Promise.resolve([]),
        requested.needsEducation ? fetchEducationContext() : Promise.resolve([]),
      ]);

    return {
      requestedModules: requested,
      food: foodContext,
      accommodationProviders: rankAndLimit(accommodationRows, message),
      productivity,
      study,
      orders,
      finance,
      lostFound,
      education,
      generatedAt: new Date().toISOString(),
    };
  }

  const [foodRows, accommodationRows] = await Promise.all([
    needsFood ? fetchApprovedFoodProviders() : Promise.resolve([]),
    needsAccommodation ? fetchApprovedAccommodationProviders() : Promise.resolve([]),
  ]);

  const foodProviders = rankAndLimit(foodRows, message);
  const accommodationProviders = rankAndLimit(accommodationRows, message);

  return {
    requestedModules: requested,
    needsFood,
    needsAccommodation,
    foodProviders,
    accommodationProviders,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  buildDatabaseContext,
};
