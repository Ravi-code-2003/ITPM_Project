const mongoose = require("mongoose");

const stickyNoteSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    color: {
      type: String,
      enum: ["amber", "sky", "rose", "mint", "lavender"],
      default: "amber",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StickyNote", stickyNoteSchema);
