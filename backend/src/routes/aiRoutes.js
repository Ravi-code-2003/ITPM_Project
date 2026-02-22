const express = require("express");
const { getChatHistory, chatWithAI } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");
const aiRateLimiter = require("../middleware/aiRateLimiter");

const router = express.Router();

router.use(protect);
router.use(authorize("student", "shop-owner", "house-owner", "education-path", "admin"));

router.get("/chat", getChatHistory);
router.post("/chat", aiRateLimiter, chatWithAI);

module.exports = router;
