const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postType: {
      type: String,
      enum: ["lost", "found"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [80, "Category cannot exceed 80 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [160, "Location cannot exceed 160 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    contactInfo: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Contact information cannot exceed 200 characters"],
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

lostFoundSchema.index({ postType: 1, category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("LostFound", lostFoundSchema);
