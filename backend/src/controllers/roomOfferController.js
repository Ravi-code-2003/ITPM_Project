const RoomOffer = require("../models/RoomOffer");
const Room = require("../models/RoomModel");
const joi = require("joi");

const offerSchema = joi
  .object({
    title: joi
      .string()
      .trim()
      .required()
      .min(5)
      .max(100)
      .pattern(/[A-Za-z]/)
      .messages({
        "string.empty": "Offer Title is required",
        "any.required": "Offer Title is required",
        "string.min": "Offer Title must be at least 5 characters",
        "string.max": "Offer Title cannot exceed 100 characters",
        "string.pattern.base": "Offer Title must contain at least one letter",
      }),
    description: joi
      .string()
      .allow("")
      .custom((value, helpers) => {
        if (value === undefined || value === null || value === "") return "";
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return helpers.message("Description cannot contain only spaces");
        }
        if (trimmed.length < 10) {
          return helpers.message("Description must be at least 10 characters when provided");
        }
        if (trimmed.length > 500) {
          return helpers.message("Description cannot exceed 500 characters");
        }
        return trimmed;
      }),
    discountType: joi
      .string()
      .required()
      .valid("none", "percentage", "fixed")
      .messages({
        "any.required": "Discount Type is required",
        "any.only": "Discount Type must be No Discount, Percentage, or Fixed Amount",
      }),
    discountAmount: joi.when("discountType", {
      is: "fixed",
      then: joi
        .number()
        .required()
        .greater(0)
        .max(500000)
        .messages({
          "number.base": "Discount Value must be numeric",
          "any.required": "Discount Value is required for Fixed Amount",
          "number.greater": "Discount Value must be greater than 0",
          "number.max": "Discount Value cannot exceed 500000",
        }),
      otherwise: joi.any().optional(),
    }),
    discountPercent: joi.when("discountType", {
      is: "percentage",
      then: joi
        .number()
        .required()
        .min(1)
        .max(100)
        .messages({
          "number.base": "Discount Value must be numeric",
          "any.required": "Discount Value is required for Percentage",
          "number.min": "Discount Value must be at least 1",
          "number.max": "Discount Value cannot exceed 100",
        }),
      otherwise: joi.any().optional(),
    }),
    validFrom: joi
      .date()
      .required()
      .custom((value, helpers) => {
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        if (selected < today) {
          return helpers.message("Valid From must be today or a future date");
        }
        return value;
      })
      .messages({
        "date.base": "Valid From must be a valid date",
        "any.required": "Valid From is required",
      }),
    validTo: joi
      .date()
      .required()
      .greater(joi.ref("validFrom"))
      .messages({
        "date.base": "Valid To must be a valid date",
        "any.required": "Valid To is required",
        "date.greater": "Valid To must be after Valid From",
      }),
  })
  .prefs({ abortEarly: false, convert: true, stripUnknown: true });

const formatValidationErrors = (error) => {
  const errors = {};
  error.details.forEach((detail) => {
    const key = detail.path?.[0];
    if (key && !errors[key]) {
      errors[key] = detail.message;
    }
  });
  return errors;
};

const findOverlappingActiveOffer = async ({ roomId, ownerId, validFrom, validTo, excludeOfferId = null }) => {
  const overlapFilter = {
    room: roomId,
    owner: ownerId,
    isActive: true,
    validFrom: { $lte: validTo },
    validTo: { $gte: validFrom },
  };

  if (excludeOfferId) {
    overlapFilter._id = { $ne: excludeOfferId };
  }

  return RoomOffer.findOne(overlapFilter).select("title validFrom validTo");
};

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
        errors: formatValidationErrors(error),
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

    const overlappingOffer = await findOverlappingActiveOffer({
      roomId,
      ownerId: req.user._id,
      validFrom,
      validTo,
    });

    if (overlappingOffer) {
      return res.status(409).json({
        message: "An active offer already overlaps for this room in the selected date range",
      });
    }

    // Create offer
    const offer = await RoomOffer.create({
      room: roomId,
      owner: req.user._id,
      title,
      description: description || "",
      discountType,
      discountAmount: discountType === "fixed" ? discountAmount : 0,
      discountPercent: discountType === "percentage" ? discountPercent : 0,
      validFrom,
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
        errors: formatValidationErrors(error),
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

    if (offer.isActive) {
      const overlappingOffer = await findOverlappingActiveOffer({
        roomId: offer.room,
        ownerId: req.user._id,
        validFrom,
        validTo,
        excludeOfferId: offer._id,
      });

      if (overlappingOffer) {
        return res.status(409).json({
          message: "An active offer already overlaps for this room in the selected date range",
        });
      }
    }

    // Update fields
    offer.title = title;
    offer.description = description || "";
    offer.discountType = discountType;
    offer.discountAmount = discountType === "fixed" ? discountAmount : 0;
    offer.discountPercent = discountType === "percentage" ? discountPercent : 0;
    offer.validFrom = validFrom;
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

    if (!offer.isActive) {
      const overlappingOffer = await findOverlappingActiveOffer({
        roomId: offer.room,
        ownerId: req.user._id,
        validFrom: offer.validFrom,
        validTo: offer.validTo,
        excludeOfferId: offer._id,
      });

      if (overlappingOffer) {
        return res.status(409).json({
          message: "Cannot activate this offer because it overlaps with another active offer for the same room",
        });
      }
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
