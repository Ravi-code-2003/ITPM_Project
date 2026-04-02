const mongoose = require("mongoose");
const StudyTimetable = require("../models/StudyTimetable");

const DAY_ORDER = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const getStartOfCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // Sunday as week start
  return start;
};

const cleanupPreviousWeeks = async (studentId) => {
  const startOfWeek = getStartOfCurrentWeek();
  await StudyTimetable.deleteMany({
    studentId,
    createdAt: { $lt: startOfWeek },
  });
};

const getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;

    // Auto-reset each week by clearing previous-week timetable items.
    await cleanupPreviousWeeks(studentId);

    const items = await StudyTimetable.find({ studentId }).lean();

    items.sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load timetable",
      error: error.message,
    });
  }
};

const createTimetableItem = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const { moduleName, plannedHours, day } = req.body;

    // Ensure a new week starts with a fresh timetable.
    await cleanupPreviousWeeks(studentId);

    if (!moduleName || !day || typeof plannedHours !== "number") {
      return res.status(400).json({
        success: false,
        message: "moduleName, plannedHours and day are required",
      });
    }

    const item = await StudyTimetable.create({
      studentId,
      moduleName: String(moduleName).trim(),
      plannedHours: Math.max(1, Math.floor(plannedHours)),
      day,
      completed: false,
    });

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add timetable item",
      error: error.message,
    });
  }
};

const updateTimetableItem = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable item id",
      });
    }

    const item = await StudyTimetable.findOne({ _id: id, studentId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Timetable item not found",
      });
    }

    if (typeof req.body.completed === "boolean") {
      item.completed = req.body.completed;
    }

    await item.save();

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update timetable item",
      error: error.message,
    });
  }
};

const deleteTimetableItem = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable item id",
      });
    }

    const deleted = await StudyTimetable.findOneAndDelete({ _id: id, studentId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Timetable item not found",
      });
    }

    res.json({
      success: true,
      message: "Timetable item deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete timetable item",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentTimetable,
  createTimetableItem,
  updateTimetableItem,
  deleteTimetableItem,
};
