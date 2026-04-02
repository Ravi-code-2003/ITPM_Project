const express = require("express");
const { getChatHistory, chatWithAI } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");
const aiRateLimiter = require("../middleware/aiRateLimiter");

// Models for database test
const FoodItem = require("../models/FoodItem");
const ComboMeal = require("../models/ComboMeal");
const Restaurant = require("../models/Restaurant");
const RoomModel = require("../models/RoomModel");
const RoomOffer = require("../models/RoomOffer");
const EducationProgram = require("../models/EducationProgram");
const LostFound = require("../models/LostFound");

const router = express.Router();

router.use(protect);
router.use(authorize("student", "shop-owner", "house-owner", "education-path", "admin"));

router.get("/chat", getChatHistory);
router.post("/chat", aiRateLimiter, chatWithAI);

// TEST ENDPOINT: Check database contents
router.get("/test/database-check", async (req, res) => {
  try {
    console.log("🔍 Testing database contents...");

    const [foodItems, comboMeals, restaurants, rooms, roomOffers, programs, lostFound] = 
      await Promise.all([
        FoodItem.find().lean().limit(5),
        ComboMeal.find().lean().limit(5),
        Restaurant.find().lean().limit(5),
        RoomModel.find().lean().limit(5),
        RoomOffer.find().lean().limit(5),
        EducationProgram.find().lean().limit(5),
        LostFound.find({ status: "Unresolved" }).lean().limit(5),
      ]);

    return res.json({
      message: "Database contents check",
      data: {
        foodItemsCount: await FoodItem.countDocuments(),
        foodItemsSample: foodItems,
        
        comboMealsCount: await ComboMeal.countDocuments(),
        comboMealsSample: comboMeals,
        
        restaurantsCount: await Restaurant.countDocuments(),
        restaurantsSample: restaurants,
        
        roomsCount: await RoomModel.countDocuments(),
        roomsSample: rooms,
        
        roomOffersCount: await RoomOffer.countDocuments(),
        roomOffersSample: roomOffers,
        
        programsCount: await EducationProgram.countDocuments(),
        programsSample: programs,
        
        lostFoundCount: await LostFound.countDocuments({ status: "Unresolved" }),
        lostFoundSample: lostFound,
      },
      status: "✅ Database is connected"
    });
  } catch (error) {
    console.error("Database check error:", error);
    return res.status(500).json({
      message: "Database check failed",
      error: error.message,
      status: "❌ Database error"
    });
  }
});

module.exports = router;
