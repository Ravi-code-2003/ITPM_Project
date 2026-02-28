const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  foodItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true
  },
  discountPercent: {
    type: Number,
    required: [true, "Discount percentage is required"],
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"]
  },
  validDate: {
    type: Date,
    required: [true, "Valid date is required"],
    validate: {
      validator: function(date) {
        return date >= new Date();
      },
      message: "Valid date must be in the future"
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
offerSchema.index({ restaurantId: 1 });
offerSchema.index({ validDate: 1 });
offerSchema.index({ isActive: 1 });

// Middleware to check if food item is available when creating offer
offerSchema.pre('save', async function() {
  const FoodItem = mongoose.model('FoodItem');
  const foodItem = await FoodItem.findById(this.foodItemId);
  if (!foodItem || foodItem.status !== 'Available') {
    throw new Error('Can only create offers for available food items');
  }
});

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;