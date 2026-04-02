const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Room owner is required"],
  },
  title: {
    type: String,
    required: [true, "Room title is required"],
    trim: true,
    minlength: 10,
    maxlength: 1000,
    match: [/[A-Za-z]/, "Room title must contain at least one alphabet"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: 20,
    maxlength: 10000,
  },
  monthlyRent: {
    type: Number,
    required: [true, "Monthly rent is required"],
    min: 1000,
    max: 5000000,
  },
  location: {
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
      match: [/^[A-Za-z\s]+$/, "Area can contain only letters and spaces"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Coordinates are required"],
      },
    },
  },
  facilities: {
    wifi: { type: Boolean, default: false },
    water: { type: Boolean, default: false },
    electricity: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    attachedBathroom: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    furnished: { type: Boolean, default: false },
    kitchen: { type: Boolean, default: false },
  },
  availability: {
    type: String,
    enum: ["AVAILABLE", "NOT_AVAILABLE"],
    default: "AVAILABLE",
  },
  availableFrom: {
    type: Date,
    default: Date.now,
  },
  availableTo: {
    type: Date,
    default: null, // null means indefinitely available
  },
  images: [
    {
      type: String, // Cloudinary URLs
    },
  ],
  roomType: {
    type: String,
    enum: ["single", "double", "shared"],
    default: "single",
  },
  gender: {
    type: String,
    enum: ["male", "female", "any"],
    default: "any",
  },
  rules: {
    type: String,
    trim: true,
    maxlength: 3000,
    validate: {
      validator: function validateRules(value) {
        if (!value) {
          return true;
        }
        return /[A-Za-z0-9]/.test(value);
      },
      message: "House rules cannot contain only symbols or spaces",
    },
  },
  viewsCount: {
    type: Number,
    default: 0,
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

// Create geospatial index for location-based queries
roomSchema.index({ "location.coordinates": "2dsphere" });
roomSchema.index({ owner: 1, createdAt: -1 });

// Update timestamp on save (modern async style)
roomSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

// Virtual for active offers
roomSchema.virtual("activeOffers", {
  ref: "RoomOffer",
  localField: "_id",
  foreignField: "room",
  match: { 
    validTo: { $gte: new Date() },
    isActive: true 
  },
});

// Populate owner details when fetching rooms
roomSchema.methods.toJSON = function() {
  const room = this.toObject({ virtuals: true });
  return room;
};

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
