const User = require("../models/User");
const FoodItem = require("../models/FoodItem");
const ComboMeal = require("../models/ComboMeal");

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
  "lunch",
  "breakfast",
  "dinner",
  "pack",
  "combo",
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

const ACADEMIC_KEYWORDS = [
  "academic",
  "academics",
  "education",
  "course",
  "courses",
  "program",
  "programs",
  "degree",
  "diploma",
  "certificate",
  "class",
  "classes",
  "lecture",
  "training",
  "tuition",
  "institute",
  "university",
  "college",
  "school",
  "club",
  "workshop",
  "seminar",
];

const CATEGORY_KEYWORDS = {
  breakfast: ["breakfast", "morning"],
  lunch: ["lunch", "noon", "midday", "pack", "packet"],
  dinner: ["dinner", "supper", "evening"],
  snack: ["snack"],
  drink: ["drink", "beverage", "juice", "coffee", "tea"],
};

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const includesAny = (text, keywords) => {
  const lower = String(text || "").toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
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

const rankFoodItems = (items, query) => {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return items.slice(0, AI_DB_CONTEXT_MAX_ITEMS);
  }

  return items
    .map((item) => ({
      item,
      score: scoreRecord(tokens, [
        item.name || "",
        item.category || "",
        item.restaurantName || "",
        item.location || "",
      ]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_DB_CONTEXT_MAX_ITEMS)
    .map((entry) => entry.item);
};

const deriveFoodCategory = (message) => {
  const lower = String(message || "").toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return null;
};

const fetchAvailableFoodItems = async ({ category }) => {
  const query = { status: "Available" };
  if (category) {
    query.category = category;
  }

  const rows = await FoodItem.find(query)
    .populate("restaurantId", "shopName location")
    .lean();

  return rows.map((row) => ({
    name: row.name,
    price: row.price,
    category: row.category,
    restaurantName: row.restaurantId?.shopName || "",
    location: row.restaurantId?.location || "",
  }));
};

const fetchAvailableComboMeals = async () => {
  const rows = await ComboMeal.find({ status: "Available" })
    .populate("restaurantId", "shopName location")
    .lean();

  return rows.map((row) => ({
    name: row.name,
    totalPrice: row.totalPrice,
    restaurantName: row.restaurantId?.shopName || "",
    location: row.restaurantId?.location || "",
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

const fetchApprovedAcademicProviders = async () => {
  const rows = await User.find({
    role: "education-path",
    status: "approved",
    isApproved: true,
  })
    .select("fullName email organizationName organizationType organizationEmail")
    .lean();

  return rows.map((row) => ({
    name: row.organizationName || row.fullName || "Unnamed Education Provider",
    organizationType: row.organizationType || "",
    contactName: row.fullName || "",
    contactEmail: row.organizationEmail || row.email || "",
    category: "academics",
  }));
};

const buildDatabaseContext = async (userMessage) => {
  const message = String(userMessage || "");
  const needsFood = includesAny(message, FOOD_KEYWORDS);
  const needsAccommodation = includesAny(message, ACCOMMODATION_KEYWORDS);
  const needsAcademics = includesAny(message, ACADEMIC_KEYWORDS);

  if (!needsFood && !needsAccommodation && !needsAcademics) {
    return null;
  }

  const foodCategory = needsFood ? deriveFoodCategory(message) : null;
  const needsCombos = needsFood && includesAny(message, ["combo", "pack", "meal"]);

  const [foodRows, accommodationRows, academicRows, foodItemRows, comboRows] = await Promise.all([
    needsFood ? fetchApprovedFoodProviders() : Promise.resolve([]),
    needsAccommodation ? fetchApprovedAccommodationProviders() : Promise.resolve([]),
    needsAcademics ? fetchApprovedAcademicProviders() : Promise.resolve([]),
    needsFood ? fetchAvailableFoodItems({ category: foodCategory }) : Promise.resolve([]),
    needsCombos ? fetchAvailableComboMeals() : Promise.resolve([]),
  ]);

  const foodProviders = rankAndLimit(foodRows, message);
  const accommodationProviders = rankAndLimit(accommodationRows, message);
  const academicProviders = rankAndLimit(academicRows, message);
  const foodItems = rankFoodItems(foodItemRows, message);
  const comboMeals = rankFoodItems(comboRows, message);

  return {
    needsFood,
    needsAccommodation,
    needsAcademics,
    foodCategory,
    foodItems,
    comboMeals,
    foodProviders,
    accommodationProviders,
    academicProviders,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  buildDatabaseContext,
};
