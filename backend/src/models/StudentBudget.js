const mongoose = require("mongoose");

const studentBudgetSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String, // YYYY-MM
      required: true,
      index: true,
    },
    monthlyBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

studentBudgetSchema.index({ studentId: 1, month: 1 }, { unique: true });

const StudentBudget = mongoose.model("StudentBudget", studentBudgetSchema);

module.exports = StudentBudget;
