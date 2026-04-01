const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .select("_id type message relatedId isRead createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

module.exports = {
  getNotifications,
};
