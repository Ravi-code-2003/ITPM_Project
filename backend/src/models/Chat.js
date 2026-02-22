const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "shop-owner", "house-owner", "education-path", "admin"],
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
