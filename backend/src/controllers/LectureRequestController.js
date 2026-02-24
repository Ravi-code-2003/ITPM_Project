const LectureRequest = require('../models/LectureRequest');

// POST /api/education/requests  — student creates a request
const createRequest = async (req, res) => {
  try {
    const { title, description, course, materialType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const request = await LectureRequest.create({
      student: req.user._id,
      title: title.trim(),
      description: description?.trim() || '',
      course: course?.trim() || '',
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

module.exports = { createRequest, getMyRequests, getAllRequests, updateRequestStatus, deleteRequest };
