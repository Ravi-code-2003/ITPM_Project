const express = require("express");
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRoomImage,
  getMyRooms,
  getCampuses,
} = require("../controllers/roomController");
const {
  createRoomRequest,
  getRoomRequests,
} = require("../controllers/roomRequestController");
const {
  createOffer,
  getRoomOffers,
} = require("../controllers/roomOfferController");
const { protect, authorize, approvedOnly } = require("../middleware/auth");
const { upload } = require("../utils/upload");

// Public routes
router.get("/", getRooms); // Get all rooms with filters
router.get("/campuses", getCampuses); // Get all campuses
router.get("/:id", getRoomById); // Get single room

// House owner protected routes
router.post(
  "/",
  protect,
  authorize("house-owner"),
  approvedOnly,
  upload.array("images", 5),
  createRoom
);

router.get(
  "/my-rooms/all",
  protect,
  authorize("house-owner"),
  approvedOnly,
  getMyRooms
);

router.put(
  "/:id",
  protect,
  authorize("house-owner"),
  approvedOnly,
  upload.array("images", 5),
  updateRoom
);

router.delete(
  "/:id/images",
  protect,
  authorize("house-owner"),
  approvedOnly,
  deleteRoomImage
);

router.delete(
  "/:id",
  protect,
  authorize("house-owner"),
  approvedOnly,
  deleteRoom
);

// Room requests routes (nested)
router.post(
  "/:roomId/requests",
  protect,
  authorize("student"),
  approvedOnly,
  createRoomRequest
);

router.get(
  "/:roomId/requests",
  protect,
  authorize("house-owner"),
  approvedOnly,
  getRoomRequests
);

// Room offers routes (nested)
router.post(
  "/:roomId/offers",
  protect,
  authorize("house-owner"),
  approvedOnly,
  createOffer
);

router.get("/:roomId/offers", getRoomOffers); // Public

module.exports = router;
