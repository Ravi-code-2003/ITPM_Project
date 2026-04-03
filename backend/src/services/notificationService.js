const Notification = require("../models/Notification");
const User = require("../models/User");

const createNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  orderId = null,
  targetPath = ""
}) => {
  if (!recipientId || !recipientRole || !type || !title || !message) {
    throw new Error("Missing required fields for notification creation");
  }

  return Notification.create({
    recipientId,
    recipientRole,
    orderId,
    type,
    title,
    message,
    targetPath
  });
};

const createOrderNotification = async ({
  recipientId,
  recipientRole,
  orderId,
  type,
  title,
  message
}) => {
  return createNotification({
    recipientId,
    recipientRole,
    orderId,
    type,
    title,
    message
  });
};

const broadcastNotificationToStudents = async ({ type, title, message, targetPath = "" }) => {
  if (!type || !title || !message) {
    throw new Error("Missing required fields for student broadcast notification");
  }

  const students = await User.find({
    role: "student",
    $and: [
      { status: { $ne: "rejected" } },
      {
        $or: [
          { isApproved: true },
          { status: "approved" },
          { isApproved: { $exists: false } }
        ]
      }
    ]
  }).select("_id").lean();

  if (!students.length) {
    return [];
  }

  const payload = students.map((student) => ({
    recipientId: student._id,
    recipientRole: "student",
    type,
    title,
    message,
    targetPath
  }));

  return Notification.insertMany(payload);
};

module.exports = {
  createNotification,
  createOrderNotification,
  broadcastNotificationToStudents
};
