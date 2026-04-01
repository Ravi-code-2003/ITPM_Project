const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    // Backward compatibility with older payloads/frontend contracts.
    totalBudget: {
      type: Number,
      min: 0,
    },
    type: {
      type: String,
      enum: ["monthly", "weekly"],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, type: 1, startDate: 1, endDate: 1 });

budgetSchema.pre("validate", function normalizeBudgetAmount() {
  if (this.amount == null && this.totalBudget != null) {
    this.amount = this.totalBudget;
  }
  if (this.totalBudget == null && this.amount != null) {
    this.totalBudget = this.amount;
  }
  if (this.amount == null && this.totalBudget == null) {
    this.invalidate("amount", "Budget amount is required");
  }
});

module.exports = mongoose.model("Budget", budgetSchema);
