const Room = require("../models/RoomModel");
const RoomRequest = require("../models/RoomRequest");
const RoomOffer = require("../models/RoomOffer");
const { uploadToCloudinary } = require("../utils/upload");
const { calculateRoomToCampusDistance } = require("../utils/distanceCalculator");
const campusLocations = require("../config/campusLocations");
const joi = require("joi");

// Validation schema for room creation/update
const roomSchema = joi.object({
  title: joi.string().required().min(5).max(100).trim(),
  description: joi.string().required().min(10).trim(),
  monthlyRent: joi.number().required().min(0),
  area: joi.string().required().trim(),
  address: joi.string().required().trim(),
  latitude: joi.number().required().min(-90).max(90),
  longitude: joi.number().required().min(-180).max(180),
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
  availability: joi.string().valid("AVAILABLE", "NOT_AVAILABLE").optional(),
  availableFrom: joi.date().optional(),
  availableTo: joi.date().allow(null).optional(),
  roomType: joi.string().valid("single", "double", "studio", "apartment").optional(),
  gender: joi.string().valid("male", "female", "any").optional(),
  rules: joi.string().allow("").trim().optional(),
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
      .populate("owner", "fullName email address");

    if (!room) {
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
    // Log received data for debugging
    console.log('Creating room - received data:', {
      ...req.body,
      facilities: req.body.facilities,
      facilitiesType: typeof req.body.facilities
    });

    // Parse facilities if it's a JSON string
    if (req.body.facilities && typeof req.body.facilities === 'string') {
      try {
        req.body.facilities = JSON.parse(req.body.facilities);
        console.log('Parsed facilities:', req.body.facilities);
        console.log('Parsed facilities type:', typeof req.body.facilities);
        console.log('Parsed facilities is object:', typeof req.body.facilities === 'object');
      } catch (e) {
        console.error('Failed to parse facilities:', e);
        return res.status(400).json({ message: "Invalid facilities format - JSON parse failed" });
      }
    }

    // If facilities is undefined or null, set default empty object
    if (!req.body.facilities) {
      console.log('No facilities provided, setting empty object');
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

    console.log('Final facilities before validation:', req.body.facilities);

    // Validate request body
    const { error, value } = roomSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
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
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images allowed" });
      }

      imageUrls = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.path))
      );
    }

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

    // Validate request body
    const { error, value } = roomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
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

    // Soft delete - just mark as inactive
    room.isActive = false;
    await room.save();

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
    const rooms = await Room.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    // Get requests count for each room
    const roomsWithStats = await Promise.all(
      rooms.map(async (room) => {
        const requestsCount = await RoomRequest.countDocuments({
          room: room._id,
          status: "PENDING",
        });
        const offersCount = await RoomOffer.countDocuments({
          room: room._id,
          isActive: true,
        });
        return {
          ...room.toObject(),
          stats: {
            pendingRequests: requestsCount,
            activeOffers: offersCount,
          },
        };
      })
    );

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
