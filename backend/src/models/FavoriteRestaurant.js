const mongoose = require("mongoose");

const favoriteRestaurantSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one favorite per student-restaurant pair
favoriteRestaurantSchema.index({ studentId: 1, restaurantId: 1 }, { unique: true });

const FavoriteRestaurant = mongoose.model("FavoriteRestaurant", favoriteRestaurantSchema);

module.exports = FavoriteRestaurant;