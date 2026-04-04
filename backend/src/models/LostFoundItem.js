const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    contactMethod: {
      type: String,
      enum: ["email", "phone", "chat", "other"],
      default: "email",
    },
    contactNote: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  { timestamps: true }
);

const lostFoundItemSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: ["electronics", "documents", "accessories", "clothing", "keys", "bags", "other"],
      default: "other",
    },
    campus: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    locationDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    lostDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    responses: [responseSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LostFoundItem", lostFoundItemSchema);
