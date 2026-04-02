const mongoose = require('mongoose');

const lectureRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    course: { type: String, trim: true, default: '' },
    materialType: {
      type: String,
      enum: ['lecture-notes', 'tutorial', 'past-paper', 'assignment', 'other'],
      default: 'lecture-notes',
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LectureRequest', lectureRequestSchema);
