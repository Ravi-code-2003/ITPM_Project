const Notification = require("../models/Notification");

const createOrderNotification = async ({
  recipientId,
  recipientRole,
  orderId,
  type,
  title,
  message
}) => {
  if (!recipientId || !recipientRole || !orderId || !type || !title || !message) {
    throw new Error("Missing required fields for notification creation");
  }

  return Notification.create({
    recipientId,
    recipientRole,
    orderId,
    type,
    title,
    message
  });
};

module.exports = {
  createOrderNotification
};
