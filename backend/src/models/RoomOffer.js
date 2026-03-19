const mongoose = require("mongoose");

const roomOfferSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: [true, "Room reference is required"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner reference is required"],
  },
  title: {
    type: String,
    required: [true, "Offer title is required"],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed", "none"],
    default: "none",
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  validFrom: {
    type: Date,
    required: [true, "Valid from date is required"],
    default: Date.now,
  },
  validTo: {
    type: Date,
    required: [true, "Valid to date is required"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
roomOfferSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Validation: Ensure validTo is after validFrom
roomOfferSchema.pre("save", function () {
  if (this.validTo <= this.validFrom) {
    throw new Error("Valid To date must be after Valid From date");
  }
});

// Method to check if offer is currently valid
roomOfferSchema.methods.isCurrentlyValid = function() {
  const now = new Date();
  return this.isActive && now >= this.validFrom && now <= this.validTo;
};

roomOfferSchema.index({ room: 1, isActive: 1 });

const RoomOffer = mongoose.model("RoomOffer", roomOfferSchema);

module.exports = RoomOffer;
