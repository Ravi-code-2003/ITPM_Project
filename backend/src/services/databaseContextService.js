const User = require("../models/User");
const FoodItem = require("../models/FoodItem");
const ComboMeal = require("../models/ComboMeal");
const RoomModel = require("../models/RoomModel");
const RoomOffer = require("../models/RoomOffer");
const RoomRequest = require("../models/RoomRequest");
const LostFound = require("../models/LostFound");
const EducationProgram = require("../models/EducationProgram");
const Note = require("../models/Note");
const Poll = require("../models/Poll");
const Restaurant = require("../models/Restaurant");

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
  "apartment",
  "sharing",
  "roommate",
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

const LOST_FOUND_KEYWORDS = [
  "lost",
  "found",
  "missing",
  "misplaced",
  "lost and found",
  "item",
  "belongings",
  "where is",
  "have you seen",
];

const NOTES_KEYWORDS = [
  "note",
  "notes",
  "document",
  "lecture notes",
  "study notes",
  "my notes",
];

const POLL_KEYWORDS = [
  "poll",
  "vote",
  "survey",
  "voting",
  "opinion",
  "suggest",
  "proposal",
];

const ROOM_OFFER_KEYWORDS = [
  "offer room",
  "rent out",
  "offering accommodation",
  "room available",
  "spare room",
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

const scoreRecord = (queryTokens, item) => {
  const haystack = JSON.stringify(item).toLowerCase();
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
      score: scoreRecord(tokens, item),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_DB_CONTEXT_MAX_ITEMS)
    .map((entry) => entry.item);
};

const rankFoodItems = (items, query) => {
  return rankAndLimit(items, query);
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

// ============ NEW FUNCTIONS FOR DATABASE-FIRST APPROACH ============

const fetchAvailableRoomOffers = async () => {
  const rows = await RoomOffer.find({ status: "Available" })
    .populate("userId", "fullName email address")
    .lean();

  return rows.map((row) => ({
    title: row.title || "Room Offer",
    description: row.description || "",
    location: row.location || "",
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    ownerName: row.userId?.fullName || "",
    ownerEmail: row.userId?.email || "",
    postedDate: row.createdAt,
    status: row.status,
    category: "accommodation",
  }));
};

const fetchAvailableRooms = async () => {
  const rows = await RoomModel.find({ status: "Available" })
    .populate("userId", "fullName email address")
    .lean();

  return rows.map((row) => ({
    type: row.type,
    location: row.location || "",
    price: row.price,
    description: row.description || "",
    features: row.features || [],
    ownerName: row.userId?.fullName || "",
    ownerEmail: row.userId?.email || "",
    postedDate: row.createdAt,
    status: row.status,
    category: "accommodation",
  }));
};

const fetchRecentLostFoundItems = async () => {
  const rows = await LostFound.find({ status: "Unresolved" })
    .sort({ createdAt: -1 })
    .limit(AI_DB_CONTEXT_MAX_ITEMS)
    .populate("userId", "fullName email")
    .lean();

  return rows.map((row) => ({
    type: row.type, // "Lost" or "Found"
    itemName: row.itemName,
    description: row.description || "",
    location: row.location || "",
    reportedDate: row.createdAt,
    reportedBy: row.userId?.fullName || "",
    contactEmail: row.userId?.email || "",
    status: row.status,
    category: "lost-and-found",
  }));
};

const fetchEducationPrograms = async () => {
  const rows = await EducationProgram.find({ status: "Approved" })
    .populate("educationPathId", "organizationName organizationType organizationEmail")
    .lean();

  return rows.map((row) => ({
    programName: row.programName,
    organizationName: row.educationPathId?.organizationName || "",
    organizationType: row.educationPathId?.organizationType || "",
    description: row.description || "",
    duration: row.duration || "",
    fee: row.fee,
    contactEmail: row.educationPathId?.organizationEmail || "",
    status: row.status,
    category: "academics",
  }));
};

const fetchRestaurants = async () => {
  const rows = await Restaurant.find({ status: "Approved" })
    .lean()
    .limit(AI_DB_CONTEXT_MAX_ITEMS);

  return rows.map((row) => ({
    restaurantName: row.restaurantName,
    location: row.location || "",
    cuisine: row.cuisine || "",
    description: row.description || "",
    rating: row.rating || 0,
    phone: row.phone || "",
    status: row.status,
    category: "food",
  }));
};

const buildDatabaseContext = async (userMessage) => {
  const message = String(userMessage || "");
  const needsFood = includesAny(message, FOOD_KEYWORDS);
  const needsAccommodation = includesAny(message, ACCOMMODATION_KEYWORDS);
  const needsAcademics = includesAny(message, ACADEMIC_KEYWORDS);
  const needsLostFound = includesAny(message, LOST_FOUND_KEYWORDS);
  const needsRoomOffer = includesAny(message, ROOM_OFFER_KEYWORDS);

  console.log("🔍 Database Context Detection:");
  console.log(`   Message: "${message}"`);
  console.log(`   Needs Food: ${needsFood}`);
  console.log(`   Needs Accommodation: ${needsAccommodation}`);
  console.log(`   Needs Academics: ${needsAcademics}`);
  console.log(`   Needs Lost Found: ${needsLostFound}`);

  if (!needsFood && !needsAccommodation && !needsAcademics && !needsLostFound) {
    console.log("   ⚠️  No matching categories found - returning null");
    return null;
  }

  const foodCategory = needsFood ? deriveFoodCategory(message) : null;
  const needsCombos = needsFood && includesAny(message, ["combo", "pack", "meal"]);

  console.log("   📡 Fetching database data in parallel...");

  // Parallel fetch all available database data
  const [
    foodRows,
    accommodationRows,
    academicRows,
    foodItemRows,
    comboRows,
    roomOffers,
    availableRooms,
    lostFoundItems,
    educationPrograms,
    restaurants,
  ] = await Promise.all([
    needsFood ? fetchApprovedFoodProviders() : Promise.resolve([]),
    needsAccommodation ? fetchApprovedAccommodationProviders() : Promise.resolve([]),
    needsAcademics ? fetchApprovedAcademicProviders() : Promise.resolve([]),
    needsFood ? fetchAvailableFoodItems({ category: foodCategory }) : Promise.resolve([]),
    needsCombos ? fetchAvailableComboMeals() : Promise.resolve([]),
    needsAccommodation || needsRoomOffer ? fetchAvailableRoomOffers() : Promise.resolve([]),
    needsAccommodation ? fetchAvailableRooms() : Promise.resolve([]),
    needsLostFound ? fetchRecentLostFoundItems() : Promise.resolve([]),
    needsAcademics ? fetchEducationPrograms() : Promise.resolve([]),
    needsFood ? fetchRestaurants() : Promise.resolve([]),
  ]);

  console.log(`   ✅ Data fetched:`);
  console.log(`      Food Items: ${foodItemRows.length}`);
  console.log(`      Combo Meals: ${comboRows.length}`);
  console.log(`      Restaurants: ${restaurants.length}`);
  console.log(`      Rooms: ${availableRooms.length}`);
  console.log(`      Room Offers: ${roomOffers.length}`);
  console.log(`      Education Programs: ${educationPrograms.length}`);
  console.log(`      Lost/Found Items: ${lostFoundItems.length}`);

  const foodProviders = rankAndLimit(foodRows, message);
  const accommodationProviders = rankAndLimit(accommodationRows, message);
  const academicProviders = rankAndLimit(academicRows, message);
  const foodItems = rankFoodItems(foodItemRows, message);
  const comboMeals = rankFoodItems(comboRows, message);
  const rankedRoomOffers = rankAndLimit(roomOffers, message);
  const rankedRooms = rankAndLimit(availableRooms, message);
  const rankedEducationPrograms = rankAndLimit(educationPrograms, message);
  const rankedRestaurants = rankAndLimit(restaurants, message);

  // Build context object with all available data
  const context = {
    needsFood,
    needsAccommodation,
    needsAcademics,
    needsLostFound,
    foodCategory,
    generatedAt: new Date().toISOString(),
    dataAvailable: {
      hasFood: foodItems.length > 0 || comboMeals.length > 0,
      hasRestaurants: restaurants.length > 0,
      hasAccommodation: rankedRooms.length > 0 || rankedRoomOffers.length > 0,
      hasLostFound: lostFoundItems.length > 0,
      hasAcademics: educationPrograms.length > 0,
    },
  };

  // Add non-empty data sections
  if (foodItems.length > 0) context.foodItems = foodItems;
  if (comboMeals.length > 0) context.comboMeals = comboMeals;
  if (foodProviders.length > 0) context.foodProviders = foodProviders;
  if (rankedRestaurants.length > 0) context.restaurants = rankedRestaurants;
  if (rankedRooms.length > 0) context.availableRooms = rankedRooms;
  if (rankedRoomOffers.length > 0) context.roomOffers = rankedRoomOffers;
  if (accommodationProviders.length > 0) context.accommodationProviders = accommodationProviders;
  if (lostFoundItems.length > 0) context.lostFoundItems = lostFoundItems;
  if (rankedEducationPrograms.length > 0) context.educationPrograms = rankedEducationPrograms;
  if (academicProviders.length > 0) context.academicProviders = academicProviders;

  const totalDataPoints = Object.keys(context).filter(k => Array.isArray(context[k])).reduce((sum, k) => sum + context[k].length, 0);
  console.log(`   📊 Total data points retrieved: ${totalDataPoints}`);

  return context;
};

module.exports = {
  buildDatabaseContext,
};
