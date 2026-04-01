const express = require("express");
const { protect } = require("../middleware/auth");
const { getClaimDetails } = require("../controllers/claimController");

const router = express.Router();

router.get("/:claimId", protect, getClaimDetails);

module.exports = router;
