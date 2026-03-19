const mongoose = require("mongoose");

const roomRequestSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: [true, "Room reference is required"],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Student reference is required"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner reference is required"],
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  studentContact: {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    whatsapp: {
      type: String,
    },
  },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING",
  },
  ownerResponse: {
    preferredContactMethod: {
      type: String,
      enum: ["call", "whatsapp", "email"],
    },
    availableVisitingTimes: {
      type: String,
      trim: true,
    },
    responseMessage: {
      type: String,
      trim: true,
    },
    respondedAt: {
      type: Date,
    },
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
roomRequestSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Prevent duplicate requests from the same student for the same room
roomRequestSchema.index({ room: 1, student: 1 }, { unique: true });

const RoomRequest = mongoose.model("RoomRequest", roomRequestSchema);

module.exports = RoomRequest;
