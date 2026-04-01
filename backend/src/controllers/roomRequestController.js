const RoomRequest = require("../models/RoomRequest");
const Room = require("../models/RoomModel");
const joi = require("joi");

// Validation schema for creating a request
const requestSchema = joi.object({
  message: joi.string().max(500).trim().allow("").optional(),
  phone: joi.string().required().trim(),
  whatsapp: joi.string().trim().allow("").optional(),
});

// Validation schema for responding to a request
const responseSchema = joi.object({
  status: joi.string().valid("ACCEPTED", "REJECTED").required(),
  preferredContactMethod: joi.string().valid("call", "whatsapp", "email").optional(),
  availableVisitingTimes: joi.string().trim().allow("").optional(),
  responseMessage: joi.string().trim().allow("").optional(),
});

// @desc    Create a room request (student sends request to owner)
// @route   POST /api/rooms/:roomId/requests
// @access  Private (Student only)
const createRoomRequest = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = requestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { message, phone, whatsapp } = value;
    const { roomId } = req.params;

    // Validate user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isActive) {
      return res.status(400).json({ message: "This room is no longer available" });
    }

    // Create request
    const roomRequest = await RoomRequest.create({
      room: roomId,
      student: req.user._id,
      owner: room.owner,
      message: message || "",
      studentContact: {
        phone,
        whatsapp: whatsapp || "",
      },
    });

    await roomRequest.populate([
      { path: "room", select: "title monthlyRent location images" },
      { path: "student", select: "fullName email" },
      { path: "owner", select: "fullName email" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Request sent successfully",
      data: roomRequest,
    });
  } catch (error) {
    console.error("Create request error:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to create request",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};

// @desc    Get all requests for owner's rooms
// @route   GET /api/room-requests/owner
// @access  Private (House Owner only)
const getOwnerRequests = async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter
    const filter = { owner: req.user._id };
    if (status) {
      filter.status = status;
    }

    const requests = await RoomRequest.find(filter)
      .populate("room", "title monthlyRent location images")
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get owner requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's own requests
// @route   GET /api/room-requests/student
// @access  Private (Student only)
const getStudentRequests = async (req, res) => {
  try {
    const requests = await RoomRequest.find({ student: req.user._id })
      .populate("room", "title monthlyRent location images availability")
      .populate("owner", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get student requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to a room request (owner responds)
// @route   PUT /api/room-requests/:id/respond
// @access  Private (House Owner only - own room requests)
const respondToRequest = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = responseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { status, preferredContactMethod, availableVisitingTimes, responseMessage } = value;

    const roomRequest = await RoomRequest.findById(req.params.id);

    if (!roomRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user is the owner
    if (roomRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    if (roomRequest.status !== "PENDING") {
      return res.status(400).json({ message: "This request has already been responded to" });
    }

    // Update request
    roomRequest.status = status;
    roomRequest.ownerResponse = {
      preferredContactMethod,
      availableVisitingTimes,
      responseMessage,
      respondedAt: new Date(),
    };

    await roomRequest.save();

    await roomRequest.populate([
      { path: "room", select: "title monthlyRent location images" },
      { path: "student", select: "fullName email" },
      { path: "owner", select: "fullName email" },
    ]);

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: roomRequest,
    });
  } catch (error) {
    console.error("Respond to request error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get requests for a specific room
// @route   GET /api/rooms/:roomId/requests
// @access  Private (House Owner only - own rooms)
const getRoomRequests = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists and user is the owner
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const requests = await RoomRequest.find({ room: roomId })
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get room requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/cancel a room request
// @route   DELETE /api/room-requests/:id
// @access  Private (Student - own requests only)
const deleteRequest = async (req, res) => {
  try {
    const roomRequest = await RoomRequest.findById(req.params.id);

    if (!roomRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user is the student who made the request
    if (roomRequest.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this request" });
    }

    await RoomRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRoomRequest,
  getOwnerRequests,
  getStudentRequests,
  respondToRequest,
  getRoomRequests,
  deleteRequest,
};
