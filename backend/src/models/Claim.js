const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    lostPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostFound",
      required: true,
      index: true,
    },
    finderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

claimSchema.index({ lostPostId: 1, finderId: 1 });
claimSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);
