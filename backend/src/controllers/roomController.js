const Room = require("../models/RoomModel");
const RoomRequest = require("../models/RoomRequest");
const RoomOffer = require("../models/RoomOffer");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/upload");
const { calculateRoomToCampusDistance } = require("../utils/distanceCalculator");
const campusLocations = require("../config/campusLocations");
const joi = require("joi");

// Validation schema for room creation/update
const roomSchema = joi.object({
  title: joi.string().trim().required().min(10).max(1000).pattern(/[A-Za-z]/).messages({
    "string.empty": "Room Title is required",
    "string.min": "Room Title must be at least 10 characters",
    "string.max": "Room Title cannot exceed 1000 characters",
    "string.pattern.base": "Room Title must contain at least one alphabet letter",
  }),
  description: joi.string().trim().required().min(20).max(10000).messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 20 characters",
    "string.max": "Description cannot exceed 10000 characters",
  }),
  monthlyRent: joi.number().required().greater(0).min(1000).max(5000000).messages({
    "number.base": "Monthly Rent must be a number",
    "number.greater": "Monthly Rent must be greater than 0",
    "number.min": "Monthly Rent must be at least 1000",
    "number.max": "Monthly Rent cannot exceed 5000000",
    "any.required": "Monthly Rent is required",
  }),
  area: joi.string().trim().required().pattern(/^[A-Za-z\s]+$/).messages({
    "string.empty": "Area is required",
    "string.pattern.base": "Area can contain only letters and spaces",
  }),
  address: joi.string().trim().required().min(10).max(2000).messages({
    "string.empty": "Address is required",
    "string.min": "Address must be at least 10 characters",
    "string.max": "Address cannot exceed 2000 characters",
  }),
  latitude: joi.number().required().min(-90).max(90),
  longitude: joi.number().required().min(-180).max(180),
  locationSelected: joi.boolean().valid(true).required().messages({
    "any.only": "Please select the location from the map",
    "any.required": "Location selection is required",
  }),
  facilities: joi.object({
    wifi: joi.boolean().optional(),
    water: joi.boolean().optional(),
    electricity: joi.boolean().optional(),
    parking: joi.boolean().optional(),
    attachedBathroom: joi.boolean().optional(),
    airConditioning: joi.boolean().optional(),
    furnished: joi.boolean().optional(),
    kitchen: joi.boolean().optional(),
  }).unknown(true).optional(), // Allow unknown facility keys and make the whole object optional
  availability: joi.string().required().valid("AVAILABLE", "NOT_AVAILABLE").messages({
    "any.only": "Availability must be Available or Not Available",
    "any.required": "Availability is required",
  }),
  availableFrom: joi.date().required().messages({
    "date.base": "Available From must be a valid date",
    "any.required": "Available From is required",
  }),
  availableTo: joi.date().allow(null).optional(),
  roomType: joi.string().required().valid("single", "double", "shared").messages({
    "any.only": "Room Type must be Single, Double, or Shared",
    "any.required": "Room Type is required",
  }),
  gender: joi.string().required().valid("male", "female", "any").messages({
    "any.only": "Gender Preference must be Male, Female, or Any",
    "any.required": "Gender Preference is required",
  }),
  rules: joi.string().trim().allow("").max(3000).custom((value, helpers) => {
    if (!value) return value;
    if (!/[A-Za-z0-9]/.test(value)) {
      return helpers.message("House Rules cannot contain only symbols or spaces");
    }
    return value;
  }).optional(),
}).unknown(true);

// @desc    Get all rooms (with filters)
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res) => {
  try {
    const {
      area,
      minRent,
      maxRent,
      roomType,
      gender,
      availability,
      wifi,
      parking,
      attachedBathroom,
      latitude,
      longitude,
      maxDistance, // in kilometers
      campusId, // for campus distance filtering
      moveInDate, // for availability date filtering
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter query
    const filter = { isActive: true };

    // Only show listings created by approved house owners.
    const approvedOwnerIds = await User.find({
      role: "house-owner",
      isApproved: true,
    }).distinct("_id");

    if (approvedOwnerIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        campus: { id: campusLocations.default.id, name: campusLocations.default.name },
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0,
        },
      });
    }

    filter.owner = { $in: approvedOwnerIds };

    if (area) {
      filter["location.area"] = { $regex: area, $options: "i" };
    }

    if (minRent || maxRent) {
      filter.monthlyRent = {};
      if (minRent) filter.monthlyRent.$gte = Number(minRent);
      if (maxRent) filter.monthlyRent.$lte = Number(maxRent);
    }

    if (roomType) {
      filter.roomType = roomType;
    }

    if (gender) {
      filter.gender = { $in: [gender, "any"] };
    }

    if (availability) {
      filter.availability = availability;
    }

    // Facility filters
    if (wifi === "true") filter["facilities.wifi"] = true;
    if (parking === "true") filter["facilities.parking"] = true;
    if (attachedBathroom === "true") filter["facilities.attachedBathroom"] = true;

    // Availability date filter
    if (moveInDate) {
      const targetDate = new Date(moveInDate);
      filter.availableFrom = { $lte: targetDate };
      filter.$or = [
        { availableTo: null }, // Indefinitely available
        { availableTo: { $gte: targetDate } },
      ];
    }

    // Location-based search
    if (latitude && longitude && maxDistance) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const distanceInMeters = parseFloat(maxDistance) * 1000;

      filter["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: distanceInMeters,
        },
      };
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = order === "asc" ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const rooms = await Room.find(filter)
      .populate("owner", "fullName email address")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Room.countDocuments(filter);

    // Populate active offers and add campus distance
    const campus = campusId ? campusLocations.getCampusById(campusId) : campusLocations.default;
    
    const roomsWithOffers = await Promise.all(
      rooms.map(async (room) => {
        const offers = await RoomOffer.find({
          room: room._id,
          isActive: true,
          validFrom: { $lte: new Date() },
          validTo: { $gte: new Date() },
        });
        
        const campusDistance = calculateRoomToCampusDistance(room, campus.coordinates);
        
        return {
          ...room.toObject(),
          activeOffers: offers,
          campusDistance,
          campusName: campus.name,
        };
      })
    );

    // Sort by campus distance if requested
    if (sortBy === "campusDistance" && campusId) {
      roomsWithOffers.sort((a, b) => {
        const distA = a.campusDistance || Infinity;
        const distB = b.campusDistance || Infinity;
        return order === "asc" ? distA - distB : distB - distA;
      });
    }

    res.status(200).json({
      success: true,
      data: roomsWithOffers,
      campus: { id: campus.id, name: campus.name },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("owner", "fullName email address role isApproved");

    if (
      !room ||
      !room.isActive ||
      !room.owner ||
      room.owner.role !== "house-owner" ||
      !room.owner.isApproved
    ) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Increment views count
    room.viewsCount += 1;
    await room.save();

    // Get active offers
    const offers = await RoomOffer.find({
      room: room._id,
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
    });

    res.status(200).json({
      success: true,
      data: {
        ...room.toObject(),
        activeOffers: offers,
      },
    });
  } catch (error) {
    console.error("Get room by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private (House Owner only)
const createRoom = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "house-owner" || !req.user.isApproved) {
      return res.status(403).json({
        message: "Only approved house owners can create room listings",
      });
    }

    // Parse facilities if it's a JSON string
    if (req.body.facilities && typeof req.body.facilities === 'string') {
      try {
        req.body.facilities = JSON.parse(req.body.facilities);
      } catch (e) {
        return res.status(400).json({ message: "Invalid facilities format - JSON parse failed" });
      }
    }

    // If facilities is undefined or null, set default empty object
    if (!req.body.facilities) {
      req.body.facilities = {};
    }

    // Ensure facilities is an object (not an array)
    if (typeof req.body.facilities !== 'object' || Array.isArray(req.body.facilities)) {
      console.error('Facilities is not a plain object:', req.body.facilities);
      return res.status(400).json({ 
        message: "Facilities must be an object",
        received: typeof req.body.facilities
      });
    }

    // Validate request body
    const { error, value } = roomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availableFromDate = new Date(value.availableFrom);
    availableFromDate.setHours(0, 0, 0, 0);

    if (availableFromDate < today) {
      return res.status(400).json({
        message: "Validation error",
        details: "Available From must be today or a future date",
      });
    }

    if (value.availableTo) {
      const availableToDate = new Date(value.availableTo);
      availableToDate.setHours(0, 0, 0, 0);

      if (availableToDate <= availableFromDate) {
        return res.status(400).json({
          message: "Validation error",
          details: "Available Until must be greater than Available From",
        });
      }
    }

    const {
      title,
      description,
      monthlyRent,
      area,
      address,
      latitude,
      longitude,
      facilities,
      availability,
      availableFrom,
      availableTo,
      roomType,
      gender,
      rules,
    } = value;

    // Handle image uploads (up to 5 images)
    let imageUrls = [];
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least 1 image is required" });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: "Maximum 5 images allowed" });
    }

    imageUrls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.path))
    );

    // Create room
    const room = await Room.create({
      owner: req.user._id,
      title,
      description,
      monthlyRent,
      location: {
        area,
        address,
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      },
      facilities: facilities || {},
      availability: availability || "AVAILABLE",
      availableFrom: availableFrom || new Date(),
      availableTo: availableTo || null,
      images: imageUrls,
      roomType: roomType || "single",
      gender: gender || "any",
      rules: rules || "",
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private (House Owner only - own rooms)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is the owner
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this room" });
    }

    // Parse facilities if it's a JSON string
    if (req.body.facilities && typeof req.body.facilities === 'string') {
      try {
        req.body.facilities = JSON.parse(req.body.facilities);
      } catch (e) {
        return res.status(400).json({ message: "Invalid facilities format" });
      }
    }

    // Keep backward compatibility for clients that do not send locationSelected.
    if (req.body.locationSelected === undefined) {
      req.body.locationSelected = true;
    }

    // Validate request body
    const { error, value } = roomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availableFromDate = new Date(value.availableFrom);
    availableFromDate.setHours(0, 0, 0, 0);

    if (availableFromDate < today) {
      return res.status(400).json({
        message: "Validation error",
        details: "Available From must be today or a future date",
      });
    }

    if (value.availableTo) {
      const availableToDate = new Date(value.availableTo);
      availableToDate.setHours(0, 0, 0, 0);

      if (availableToDate <= availableFromDate) {
        return res.status(400).json({
          message: "Validation error",
          details: "Available Until must be greater than Available From",
        });
      }
    }

    const {
      title,
      description,
      monthlyRent,
      area,
      address,
      latitude,
      longitude,
      facilities,
      availability,
      availableFrom,
      availableTo,
      roomType,
      gender,
      rules,
    } = value;

    // Handle new image uploads
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const currentImagesCount = room.images.length;
      const totalImages = currentImagesCount + req.files.length;

      if (totalImages > 5) {
        return res.status(400).json({
          message: `Cannot upload ${req.files.length} more images. Current: ${currentImagesCount}, Max: 5`,
        });
      }

      newImageUrls = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.path))
      );
    }

    if (room.images.length + newImageUrls.length < 1) {
      return res.status(400).json({ message: "At least 1 image is required" });
    }

    // Update fields
    room.title = title;
    room.description = description;
    room.monthlyRent = monthlyRent;
    room.location.area = area;
    room.location.address = address;
    room.location.coordinates.coordinates = [parseFloat(longitude), parseFloat(latitude)];
    room.facilities = facilities || room.facilities;
    room.availability = availability || room.availability;
    room.availableFrom = availableFrom || room.availableFrom;
    room.availableTo = availableTo !== undefined ? availableTo : room.availableTo;
    room.roomType = roomType || room.roomType;
    room.gender = gender || room.gender;
    room.rules = rules !== undefined ? rules : room.rules;

    if (newImageUrls.length > 0) {
      room.images = [...room.images, ...newImageUrls];
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete room image
// @route   DELETE /api/rooms/:id/images
// @access  Private (House Owner only - own rooms)
const deleteRoomImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is the owner
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this room" });
    }

    room.images = room.images.filter((img) => img !== imageUrl);
    await room.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: room,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (House Owner only - own rooms)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is the owner
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this room" });
    }

    // Hard delete room and related records so it is fully removed.
    await Promise.all([
      RoomRequest.deleteMany({ room: room._id }),
      RoomOffer.deleteMany({ room: room._id }),
      Room.deleteOne({ _id: room._id }),
    ]);

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get owner's rooms
// @route   GET /api/rooms/my-rooms
// @access  Private (House Owner only)
const getMyRooms = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "house-owner" || !req.user.isApproved) {
      return res.status(403).json({
        message: "Only approved house owners can access room listings",
      });
    }

    const rooms = await Room.find({ owner: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (rooms.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const roomIds = rooms.map((room) => room._id);

    // Aggregate pending requests counts in one query
    const pendingRequestsAgg = await RoomRequest.aggregate([
      {
        $match: {
          room: { $in: roomIds },
          status: "PENDING",
        },
      },
      {
        $group: {
          _id: "$room",
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate active offers counts in one query
    const activeOffersAgg = await RoomOffer.aggregate([
      {
        $match: {
          room: { $in: roomIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$room",
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingRequestsMap = new Map(
      pendingRequestsAgg.map((item) => [item._id.toString(), item.count])
    );
    const activeOffersMap = new Map(
      activeOffersAgg.map((item) => [item._id.toString(), item.count])
    );

    const roomsWithStats = rooms.map((room) => ({
      ...room,
      stats: {
        pendingRequests: pendingRequestsMap.get(room._id.toString()) || 0,
        activeOffers: activeOffersMap.get(room._id.toString()) || 0,
      },
    }));

    res.status(200).json({
      success: true,
      data: roomsWithStats,
    });
  } catch (error) {
    console.error("Get my rooms error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all campus locations
// @route   GET /api/rooms/campuses
// @access  Public
const getCampuses = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: campusLocations.getAllCampuses(),
      default: campusLocations.default,
    });
  } catch (error) {
    console.error("Get campuses error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRoomImage,
  getMyRooms,
  getCampuses,
};
