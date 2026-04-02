const StudySession = require("../models/StudySession");
const mongoose = require("mongoose");

const getStudyTrackerSessions = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const sessions = await StudySession.find({ studentId })
      .sort({ endedAt: -1 })
      .lean();

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load study sessions",
      error: error.message,
    });
  }
};

const createStudySession = async (req, res) => {
  try {
    const { startedAt, endedAt, durationMs, pauseCount = 0 } = req.body;
    const studentId = req.user?._id || req.user?.id;

    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(401).json({
        success: false,
        message: "Invalid student session. Please log in again.",
      });
    }

    if (!startedAt || !endedAt || typeof durationMs !== "number" || Number.isNaN(durationMs)) {
      return res.status(400).json({
        success: false,
        message: "startedAt, endedAt and durationMs are required",
      });
    }

    const started = new Date(startedAt);
    const ended = new Date(endedAt);

    if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startedAt or endedAt",
      });
    }

    if (ended < started) {
      return res.status(400).json({
        success: false,
        message: "endedAt must be after startedAt",
      });
    }

    const session = await StudySession.create({
      studentId,
      startedAt: started,
      endedAt: ended,
      durationMs: Math.max(0, Math.floor(durationMs)),
      pauseCount: Math.max(0, Math.floor(pauseCount || 0)),
      expiresAt: new Date(ended.getTime() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Study tracker save error:", {
      message: error.message,
      userId: req.user?._id || req.user?.id,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: `Failed to save study session: ${error.message}`,
      error: error.message,
    });
  }
};

module.exports = {
  getStudyTrackerSessions,
  createStudySession,
};
