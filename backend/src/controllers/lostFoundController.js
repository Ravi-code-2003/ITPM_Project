const mongoose = require("mongoose");
const LostFoundItem = require("../models/LostFoundItem");
const { uploadToCloudinary } = require("../utils/upload");

const getStudentId = (req) => req.user?._id || req.user?.id;

const normalizeCreatePayload = (payload = {}) => {
  const itemName = typeof payload.itemName === "string" ? payload.itemName.trim() : "";
  const category = typeof payload.category === "string" ? payload.category.trim().toLowerCase() : "other";
  const campus = typeof payload.campus === "string" ? payload.campus.trim() : "";
  const locationDetails = typeof payload.locationDetails === "string" ? payload.locationDetails.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const lostDateRaw = payload.lostDate ? new Date(payload.lostDate) : null;

  return {
    itemName,
    category,
    campus,
    locationDetails,
    description,
    lostDate: lostDateRaw && !Number.isNaN(lostDateRaw.getTime()) ? lostDateRaw : null,
  };
};

const normalizeResponsePayload = (payload = {}) => {
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const contactMethod = typeof payload.contactMethod === "string" ? payload.contactMethod.trim().toLowerCase() : "email";
  const contactNote = typeof payload.contactNote === "string" ? payload.contactNote.trim() : "";

  return {
    message,
    contactMethod,
    contactNote,
  };
};

const allowedCategories = ["electronics", "documents", "accessories", "clothing", "keys", "bags", "other"];
const allowedContactMethods = ["email", "phone", "chat", "other"];

const basePopulate = [
  { path: "reportedBy", select: "fullName email" },
  { path: "responses.responderId", select: "fullName email" },
  { path: "resolvedWith", select: "fullName email" },
];

const getLostFoundItems = async (req, res) => {
  try {
    const studentId = String(getStudentId(req));
    const { status, mine, q } = req.query;

    const query = {};

    if (status && ["open", "resolved"].includes(String(status))) {
      query.status = String(status);
    }

    if (String(mine) === "true") {
      query.reportedBy = studentId;
    }

    if (q && typeof q === "string") {
      const search = q.trim();
      if (search) {
        query.$or = [
          { itemName: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { campus: { $regex: search, $options: "i" } },
          { locationDetails: { $regex: search, $options: "i" } },
        ];
      }
    }

    const items = await LostFoundItem.find(query)
      .populate(basePopulate)
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load lost and found items",
      error: error.message,
    });
  }
};

const createLostFoundItem = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(401).json({ success: false, message: "Invalid student session. Please log in again." });
    }

    const { itemName, category, campus, locationDetails, description, lostDate } = normalizeCreatePayload(req.body);

    if (!itemName || !campus || !locationDetails || !description || !lostDate) {
      return res.status(400).json({ success: false, message: "Please fill all required fields." });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category selected." });
    }

    let imageUrl = "";
    if (req.file?.path) {
      imageUrl = await uploadToCloudinary(req.file.path);
    }

    const item = await LostFoundItem.create({
      reportedBy: studentId,
      itemName,
      category,
      campus,
      locationDetails,
      description,
      lostDate,
      imageUrl,
    });

    const created = await LostFoundItem.findById(item._id).populate(basePopulate);

    return res.status(201).json({ success: true, item: created });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create lost item",
      error: error.message,
    });
  }
};

const updateLostFoundItem = async (req, res) => {
  try {
    const studentId = String(getStudentId(req));
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, message: "Invalid item id." });
    }

    const item = await LostFoundItem.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    if (String(item.reportedBy) !== studentId) {
      return res.status(403).json({ success: false, message: "You can only edit your own items." });
    }

    const payload = normalizeCreatePayload(req.body);

    if (payload.itemName) item.itemName = payload.itemName;
    if (payload.campus) item.campus = payload.campus;
    if (payload.locationDetails) item.locationDetails = payload.locationDetails;
    if (payload.description) item.description = payload.description;
    if (payload.lostDate) item.lostDate = payload.lostDate;
    if (allowedCategories.includes(payload.category)) item.category = payload.category;

    if (req.file?.path) {
      item.imageUrl = await uploadToCloudinary(req.file.path);
    }

    await item.save();
    await item.populate(basePopulate);

    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error.message,
    });
  }
};

const deleteLostFoundItem = async (req, res) => {
  try {
    const studentId = String(getStudentId(req));
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, message: "Invalid item id." });
    }

    const deleted = await LostFoundItem.findOneAndDelete({ _id: id, reportedBy: studentId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    return res.json({ success: true, message: "Item removed." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
};

const respondToLostFoundItem = async (req, res) => {
  try {
    const studentId = String(getStudentId(req));
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, message: "Invalid item id." });
    }

    const item = await LostFoundItem.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    if (item.status !== "open") {
      return res.status(400).json({ success: false, message: "This item is already resolved." });
    }

    if (String(item.reportedBy) === studentId) {
      return res.status(400).json({ success: false, message: "You cannot respond to your own item." });
    }

    const { message, contactMethod, contactNote } = normalizeResponsePayload(req.body);

    if (!message) {
      return res.status(400).json({ success: false, message: "Please add a message to contact the owner." });
    }

    if (!allowedContactMethods.includes(contactMethod)) {
      return res.status(400).json({ success: false, message: "Invalid contact method." });
    }

    const alreadyResponded = item.responses.some((r) => String(r.responderId) === studentId);
    if (alreadyResponded) {
      return res.status(400).json({ success: false, message: "You already sent a response for this item." });
    }

    item.responses.push({
      responderId: studentId,
      message,
      contactMethod,
      contactNote,
    });

    await item.save();
    await item.populate(basePopulate);

    return res.status(201).json({
      success: true,
      item,
      message: "Response sent. The owner can now contact you.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send response",
      error: error.message,
    });
  }
};

const resolveLostFoundItem = async (req, res) => {
  try {
    const studentId = String(getStudentId(req));
    const { id, responseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id)) || !mongoose.Types.ObjectId.isValid(String(responseId))) {
      return res.status(400).json({ success: false, message: "Invalid item or response id." });
    }

    const item = await LostFoundItem.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    if (String(item.reportedBy) !== studentId) {
      return res.status(403).json({ success: false, message: "Only the owner can mark this item as resolved." });
    }

    const selectedResponse = item.responses.id(responseId);
    if (!selectedResponse) {
      return res.status(404).json({ success: false, message: "Response not found." });
    }

    item.status = "resolved";
    item.resolvedAt = new Date();
    item.resolvedWith = selectedResponse.responderId;

    await item.save();
    await item.populate(basePopulate);

    return res.json({ success: true, item, message: "Item marked as resolved." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resolve item",
      error: error.message,
    });
  }
};

module.exports = {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
  respondToLostFoundItem,
  resolveLostFoundItem,
};
