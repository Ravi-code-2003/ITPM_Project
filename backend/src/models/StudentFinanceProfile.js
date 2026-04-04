const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    percent: {
      type: Number,
      required: true,
      min: [0, "Percent cannot be negative"],
      max: [100, "Percent cannot be greater than 100"],
    },
  },
  { _id: false }
);

const studentFinanceProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, "Monthly budget cannot be negative"],
    },
    expenseCategories: {
      type: [expenseCategorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentFinanceProfile", studentFinanceProfileSchema);
