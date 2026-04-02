const mongoose = require("mongoose");

const studyTimetableSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    moduleName: {
      type: String,
      required: true,
      trim: true,
    },
    plannedHours: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
    },
    day: {
      type: String,
      required: true,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudyTimetable", studyTimetableSchema);
