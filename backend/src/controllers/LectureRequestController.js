const LectureRequest = require('../models/LectureRequest');

const getLetterCount = (value) => (value.match(/[A-Za-z]/g) || []).length;

// POST /api/education/requests  — student creates a request
const createRequest = async (req, res) => {
  try {
    const { title, description, course, materialType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const courseValue = typeof course === 'string' ? course.trim() : '';
    if (courseValue && !/^[A-Za-z\s]+$/.test(courseValue)) {
      return res.status(400).json({ message: 'Course can contain only letters and spaces.' });
    }

    const descriptionValue = typeof description === 'string' ? description.trim() : '';
    if (descriptionValue) {
      const letterCount = getLetterCount(descriptionValue);
      if (letterCount < 10 || letterCount > 100) {
        return res.status(400).json({ message: 'Additional Details must be between 10 and 100 letters.' });
      }
    }

    const request = await LectureRequest.create({
      student: req.user._id,
      title: title.trim(),
      description: descriptionValue,
      course: courseValue,
      materialType: materialType || 'lecture-notes',
    });

    const populated = await request.populate('student', 'fullName email');
    res.status(201).json({ success: true, request: populated });
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/education/requests   — student views their own requests
const getMyRequests = async (req, res) => {
  try {
    const requests = await LectureRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error('getMyRequests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/education/requests/:id  — student updates their own pending request
const updateMyRequest = async (req, res) => {
  try {
    const { title, description, course, materialType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const courseValue = typeof course === 'string' ? course.trim() : '';
    if (courseValue && !/^[A-Za-z\s]+$/.test(courseValue)) {
      return res.status(400).json({ message: 'Course can contain only letters and spaces.' });
    }

    const descriptionValue = typeof description === 'string' ? description.trim() : '';
    if (descriptionValue) {
      const letterCount = getLetterCount(descriptionValue);
      if (letterCount < 10 || letterCount > 100) {
        return res.status(400).json({ message: 'Additional Details must be between 10 and 100 letters.' });
      }
    }

    const request = await LectureRequest.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be updated' });
    }

    request.title = title.trim();
    request.description = descriptionValue;
    request.course = courseValue;
    request.materialType = materialType || request.materialType;

    await request.save();
    res.json({ success: true, request });
  } catch (error) {
    console.error('updateMyRequest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/education/requests/all  — education provider views all requests
const getAllRequests = async (req, res) => {
  try {
    const requests = await LectureRequest.find()
      .populate('student', 'fullName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error('getAllRequests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/education/requests/:id  — education provider updates status
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const VALID = ['pending', 'fulfilled', 'rejected'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const request = await LectureRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote?.trim() || '' },
      { new: true }
    ).populate('student', 'fullName email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('updateRequestStatus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/education/requests/:id  — student deletes their own request
const deleteRequest = async (req, res) => {
  try {
    const request = await LectureRequest.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await request.deleteOne();
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error('deleteRequest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createRequest, getMyRequests, updateMyRequest, getAllRequests, updateRequestStatus, deleteRequest };
