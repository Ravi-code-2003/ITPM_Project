const RoomOffer = require("../models/RoomOffer");
const Room = require("../models/RoomModel");
const joi = require("joi");

// Validation schema for creating/updating offer
const offerSchema = joi.object({
  title: joi.string().required().min(3).max(100).trim(),
  description: joi.string().max(500).trim().allow("").optional(),
  discountType: joi.string().valid("percentage", "fixed", "none").optional(),
  discountAmount: joi.number().min(0).optional(),
  discountPercent: joi.number().min(0).max(100).optional(),
  validFrom: joi.date().optional(),
  validTo: joi.date().required(),
});

// @desc    Create offer for a room
// @route   POST /api/rooms/:roomId/offers
// @access  Private (House Owner only - own rooms)
const createOffer = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = offerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const {
      title,
      description,
      discountType,
      discountAmount,
      discountPercent,
      validFrom,
      validTo,
    } = value;

    const { roomId } = req.params;

    // Check if room exists and user is the owner
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isActive) {
      return res.status(400).json({ message: "Cannot create offers for inactive/deleted rooms" });
    }

    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to create offer for this room" });
    }

    // Create offer
    const offer = await RoomOffer.create({
      room: roomId,
      owner: req.user._id,
      title,
      description: description || "",
      discountType: discountType || "none",
      discountAmount: discountAmount || 0,
      discountPercent: discountPercent || 0,
      validFrom: validFrom || new Date(),
      validTo,
    });

    await offer.populate("room", "title monthlyRent");

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Create offer error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all offers for a room
// @route   GET /api/rooms/:roomId/offers
// @access  Public
const getRoomOffers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { includeExpired } = req.query;

    const room = await Room.findById(roomId).select("isActive");
    if (!room || !room.isActive) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Build filter
    const filter = { room: roomId, isActive: true };
    
    if (!includeExpired) {
      filter.validTo = { $gte: new Date() };
    }

    const offers = await RoomOffer.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error("Get room offers error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all offers for owner's rooms
// @route   GET /api/room-offers/my-offers
// @access  Private (House Owner only)
const getMyOffers = async (req, res) => {
  try {
    const offers = await RoomOffer.find({ owner: req.user._id })
      .populate({
        path: "room",
        select: "title monthlyRent isActive",
        match: { isActive: true },
      })
      .sort({ createdAt: -1 });

    // Hide offers linked to deleted/inactive rooms and deactivate them for consistency.
    const invalidOffers = offers.filter((offer) => !offer.room && offer.isActive);
    if (invalidOffers.length > 0) {
      await RoomOffer.updateMany(
        { _id: { $in: invalidOffers.map((offer) => offer._id) } },
        { $set: { isActive: false } }
      );
    }

    const filteredOffers = offers.filter((offer) => Boolean(offer.room));

    res.status(200).json({
      success: true,
      data: filteredOffers,
    });
  } catch (error) {
    console.error("Get my offers error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update offer
// @route   PUT /api/room-offers/:id
// @access  Private (House Owner only - own offers)
const updateOffer = async (req, res) => {
  try {
    const offer = await RoomOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the owner
    if (offer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this offer" });
    }

    // Validate request body
    const { error, value } = offerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const {
      title,
      description,
      discountType,
      discountAmount,
      discountPercent,
      validFrom,
      validTo,
    } = value;

    // Update fields
    offer.title = title;
    offer.description = description || offer.description;
    offer.discountType = discountType || offer.discountType;
    offer.discountAmount = discountAmount !== undefined ? discountAmount : offer.discountAmount;
    offer.discountPercent = discountPercent !== undefined ? discountPercent : offer.discountPercent;
    offer.validFrom = validFrom || offer.validFrom;
    offer.validTo = validTo;

    await offer.save();
    await offer.populate("room", "title monthlyRent");

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Update offer error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete offer (soft delete)
// @route   DELETE /api/room-offers/:id
// @access  Private (House Owner only - own offers)
const deleteOffer = async (req, res) => {
  try {
    const offer = await RoomOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the owner
    if (offer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this offer" });
    }

    // Soft delete
    offer.isActive = false;
    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Delete offer error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle offer active status
// @route   PATCH /api/room-offers/:id/toggle
// @access  Private (House Owner only - own offers)
const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await RoomOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the owner
    if (offer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this offer" });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer ${offer.isActive ? "activated" : "deactivated"} successfully`,
      data: offer,
    });
  } catch (error) {
    console.error("Toggle offer error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffer,
  getRoomOffers,
  getMyOffers,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
};
