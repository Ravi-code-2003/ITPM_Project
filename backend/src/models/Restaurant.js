const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  shopOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// The shopOwnerId field already has unique: true which creates an index
// No need for explicit index declaration

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;