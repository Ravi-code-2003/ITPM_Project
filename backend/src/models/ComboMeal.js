const mongoose = require("mongoose");

const comboMealSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  name: {
    type: String,
    required: [true, "Combo meal name is required"],
    trim: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true
  }],
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
    min: [0, "Price cannot be negative"]
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
comboMealSchema.index({ restaurantId: 1 });
comboMealSchema.index({ status: 1 });

// Validation to ensure at least 2 items in combo
comboMealSchema.pre('save', function() {
  if (this.items.length < 2) {
    throw new Error('Combo meal must have at least 2 items');
  }
});

// Middleware to check if all food items are available when creating combo
comboMealSchema.pre('save', async function() {
  const FoodItem = mongoose.model('FoodItem');
  const foodItems = await FoodItem.find({ _id: { $in: this.items } });
  
  if (foodItems.some(item => item.status !== 'Available')) {
    throw new Error('Can only create combos with available food items');
  }
});

const ComboMeal = mongoose.model("ComboMeal", comboMealSchema);

module.exports = ComboMeal;