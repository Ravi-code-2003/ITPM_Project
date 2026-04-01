const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
  try {
    const { limit = 20, unreadOnly = "false" } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

    const query = {
      recipientId: req.user.id
    };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("orderId", "orderNumber status totalAmount")
        .sort({ createdAt: -1 })
        .limit(parsedLimit),
      Notification.countDocuments({ recipientId: req.user.id, isRead: false })
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientId: req.user.id
      },
      {
        isRead: true,
        readAt: new Date()
      },
      {
        new: true
      }
    ).populate("orderId", "orderNumber status totalAmount");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false
    });

    res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      updatedCount: result.modifiedCount,
      unreadCount: 0
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
