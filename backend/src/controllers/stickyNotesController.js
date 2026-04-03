const mongoose = require("mongoose");
const StickyNote = require("../models/StickyNote");

const NOTE_COLORS = ["amber", "sky", "rose", "mint", "lavender"];

const getStudentId = (req) => req.user?._id || req.user?.id;

const normalizeNotePayload = (payload = {}) => {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  const color = typeof payload.color === "string" ? payload.color.trim().toLowerCase() : "amber";

  return {
    title,
    content,
    color,
  };
};

const validateColor = (color) => NOTE_COLORS.includes(color);

const getStickyNotes = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    const notes = await StickyNote.find({ studentId })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load sticky notes",
      error: error.message,
    });
  }
};

const createStickyNote = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(401).json({
        success: false,
        message: "Invalid student session. Please log in again.",
      });
    }

    const { title, content, color } = normalizeNotePayload(req.body);

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    if (!validateColor(color)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note color",
      });
    }

    const note = await StickyNote.create({
      studentId,
      title,
      content,
      color,
    });

    return res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create sticky note",
      error: error.message,
    });
  }
};

const updateStickyNote = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid note id",
      });
    }

    const existing = await StickyNote.findOne({ _id: id, studentId });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sticky note not found",
      });
    }

    const { title, content, color } = normalizeNotePayload(req.body);

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    if (!validateColor(color)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note color",
      });
    }

    existing.title = title;
    existing.content = content;
    existing.color = color;

    await existing.save();

    return res.json({
      success: true,
      note: existing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update sticky note",
      error: error.message,
    });
  }
};

const deleteStickyNote = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid note id",
      });
    }

    const deleted = await StickyNote.findOneAndDelete({ _id: id, studentId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Sticky note not found",
      });
    }

    return res.json({
      success: true,
      message: "Sticky note deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete sticky note",
      error: error.message,
    });
  }
};

module.exports = {
  getStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
};
