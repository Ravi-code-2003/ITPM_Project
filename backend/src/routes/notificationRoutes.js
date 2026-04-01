const express = require("express");
const { protect, authorize, approvedOnly } = require("../middleware/auth");
const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);
router.use(authorize("student", "shop-owner"));
router.use(approvedOnly);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

module.exports = router;
