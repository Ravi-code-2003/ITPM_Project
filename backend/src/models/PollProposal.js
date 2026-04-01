const mongoose = require("mongoose");

const pollProposalSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",
    required: true
  },
  foodItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true
  },
  proposedDiscount: {
    type: Number,
    required: [true, "Proposed discount is required"],
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"]
  },
  description: {
    type: String,
    required: [true, "Proposal description is required"],
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
pollProposalSchema.index({ pollId: 1 });
pollProposalSchema.index({ votes: -1 });

// Compound index to prevent duplicate food items in same poll
pollProposalSchema.index({ pollId: 1, foodItemId: 1 }, { unique: true });

const PollProposal = mongoose.model("PollProposal", pollProposalSchema);

module.exports = PollProposal;