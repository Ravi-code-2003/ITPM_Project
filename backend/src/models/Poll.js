const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  title: {
    type: String,
    required: [true, "Poll title is required"],
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Poll is for "next day" offers
  pollDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default expiry: end of current day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Legacy fields for backward compatibility
  foodItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem"
  },
  votes: {
    type: Number,
    default: 0
  }
});

// Indexes
pollSchema.index({ restaurantId: 1 });
pollSchema.index({ pollDate: -1 });
pollSchema.index({ isActive: 1 });
pollSchema.index({ expiresAt: 1 });

// Virtual for checking if poll is expired
pollSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Method to check if user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  return this.voters.some(voter => voter.toString() === userId.toString());
};

// Pre-save middleware to update isActive based on expiry
pollSchema.pre('save', function() {
  if (this.isExpired) {
    this.isActive = false;
  }
});

const Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;