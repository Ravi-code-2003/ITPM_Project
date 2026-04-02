const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationMs: {
      type: Number,
      required: true,
      min: 0,
    },
    pauseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Sessions are automatically removed 7 days after they end.
    expiresAt: {
      type: Date,
      required: false,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.pre("validate", function preValidate() {
  if (!this.expiresAt && this.endedAt) {
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(new Date(this.endedAt).getTime() + ttlMs);
  }
});

module.exports = mongoose.model("StudySession", studySessionSchema);
