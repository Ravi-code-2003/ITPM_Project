const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be between 1 and 5"],
    max: [5, "Rating must be between 1 and 5"]
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, "Comment cannot exceed 500 characters"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one rating per student-restaurant pair
ratingSchema.index({ studentId: 1, restaurantId: 1 }, { unique: true });

// Update timestamp on save
ratingSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;