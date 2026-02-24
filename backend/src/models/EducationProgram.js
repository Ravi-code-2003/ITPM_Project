const mongoose = require('mongoose');

const educationProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate', 'Intermediate to Advanced', 'All Levels'],
      required: true,
    },
    price: { type: String, default: 'Free' },
    description: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    students: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EducationProgram', educationProgramSchema);
