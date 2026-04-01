const User = require("../models/User");

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

const buildDatabaseContext = async (userMessage) => {
  const message = String(userMessage || "");
  const needsFood = includesAny(message, FOOD_KEYWORDS);
  const needsAccommodation = includesAny(message, ACCOMMODATION_KEYWORDS);

  if (!needsFood && !needsAccommodation) {
    return null;
  }

  const [foodRows, accommodationRows] = await Promise.all([
    needsFood ? fetchApprovedFoodProviders() : Promise.resolve([]),
    needsAccommodation ? fetchApprovedAccommodationProviders() : Promise.resolve([]),
  ]);

  const foodProviders = rankAndLimit(foodRows, message);
  const accommodationProviders = rankAndLimit(accommodationRows, message);

  return {
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
