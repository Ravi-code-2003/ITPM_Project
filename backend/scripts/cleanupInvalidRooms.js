const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Room = require("../src/models/RoomModel");
const RoomRequest = require("../src/models/RoomRequest");
const RoomOffer = require("../src/models/RoomOffer");
const User = require("../src/models/User");

dotenv.config();

const suspectTitlePatterns = [
  /^a{8,}$/i,
  /^dfadf[a-z]*$/i,
  /^deneth\s+pissa$/i,
  /^spacious\s+double\s+room\s+with\s+balcony$/i,
  /^cozy\s+single\s+room\s+near\s+campus$/i,
];

const cleanupInvalidRooms = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set in backend/.env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const validHouseOwnerIds = await User.find({
      role: "house-owner",
      isApproved: true,
    }).distinct("_id");

    const invalidOwnerRooms = await Room.find({
      $or: [
        { owner: { $exists: false } },
        { owner: null },
        { owner: { $nin: validHouseOwnerIds } },
      ],
    }).select("_id title owner");

    const noImageRooms = await Room.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
      ],
    }).select("_id title owner");

    const allRooms = await Room.find({}).select("_id title owner");
    const suspectTitleRooms = allRooms.filter((room) =>
      suspectTitlePatterns.some((pattern) => pattern.test((room.title || "").trim()))
    );

    const roomIdSet = new Set();
    invalidOwnerRooms.forEach((room) => roomIdSet.add(String(room._id)));
    noImageRooms.forEach((room) => roomIdSet.add(String(room._id)));
    suspectTitleRooms.forEach((room) => roomIdSet.add(String(room._id)));

    const roomIdsToDelete = Array.from(roomIdSet);

    console.log(`Invalid owner rooms: ${invalidOwnerRooms.length}`);
    console.log(`No-image rooms: ${noImageRooms.length}`);
    console.log(`Suspect title rooms: ${suspectTitleRooms.length}`);
    console.log(`Total unique rooms to delete: ${roomIdsToDelete.length}`);

    if (roomIdsToDelete.length === 0) {
      console.log("No invalid rooms found. Nothing to delete.");
      process.exit(0);
    }

    const objectIds = roomIdsToDelete.map((id) => new mongoose.Types.ObjectId(id));

    const [requestDeleteResult, offerDeleteResult, roomDeleteResult] = await Promise.all([
      RoomRequest.deleteMany({ room: { $in: objectIds } }),
      RoomOffer.deleteMany({ room: { $in: objectIds } }),
      Room.deleteMany({ _id: { $in: objectIds } }),
    ]);

    console.log(`Deleted room requests: ${requestDeleteResult.deletedCount || 0}`);
    console.log(`Deleted room offers: ${offerDeleteResult.deletedCount || 0}`);
    console.log(`Deleted rooms: ${roomDeleteResult.deletedCount || 0}`);

    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error.message);
    process.exit(1);
  }
};

cleanupInvalidRooms();
