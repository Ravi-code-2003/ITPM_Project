const mongoose = require('mongoose');

const lectureMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['pdf', 'tute', 'pastpaper', 'youtube', 'drive'],
      required: true,
    },
    // For file uploads (pdf / tute / pastpaper)
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number }, // bytes
    // For external links (youtube / drive)
    linkUrl: { type: String },
    // Optional course tag
    course: { type: String, trim: true, default: '' },
    // Mark as important — visible-only in Exam Mode
    isImportant: { type: Boolean, default: false },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LectureMaterial', lectureMaterialSchema);
