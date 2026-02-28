const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  foodItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true
  },
  comboMealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ComboMeal"
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"]
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"]
  }
});

const orderSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  items: [orderItemSchema],
  orderType: {
    type: String,
    enum: ["Pickup"],
    default: "Pickup"
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, "Total amount cannot be negative"]
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "ready", "completed", "cancelled"],
    default: "pending"
  },
  orderNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
orderSchema.index({ studentId: 1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Generate unique order number before saving
orderSchema.pre('save', function() {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;