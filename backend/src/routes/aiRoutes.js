const express = require("express");
const { getChatHistory, chatWithAI, budgetAdvice } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");
const aiRateLimiter = require("../middleware/aiRateLimiter");

const router = express.Router();

router.use(protect);
router.use(authorize("student", "shop-owner", "house-owner", "education-path", "admin"));

router.get("/chat", getChatHistory);
router.post("/chat", aiRateLimiter, chatWithAI);
router.post("/budget-advice", aiRateLimiter, budgetAdvice);

module.exports = router;
