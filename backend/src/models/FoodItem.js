const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  name: {
    type: String,
    required: [true, "Food name is required"],
    trim: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  category: {
    type: String,
    required: true,
    enum: ["breakfast", "lunch", "dinner", "snack", "drink"]
  },
  status: {
    type: String,
    enum: ["Available", "OutOfStock"],
    default: "Available"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
foodItemSchema.index({ restaurantId: 1 });
foodItemSchema.index({ category: 1 });
foodItemSchema.index({ status: 1 });

const FoodItem = mongoose.model("FoodItem", foodItemSchema);

module.exports = FoodItem;