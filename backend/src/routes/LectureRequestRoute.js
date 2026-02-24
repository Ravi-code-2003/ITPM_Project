const express = require('express');
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
} = require('../controllers/LectureRequestController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student routes
router.post('/',       authorize('student'),               createRequest);
router.get('/',        authorize('student'),               getMyRequests);
router.delete('/:id',  authorize('student'),               deleteRequest);

// Education provider routes
router.get('/all',     authorize('education-path', 'admin'), getAllRequests);
router.put('/:id',     authorize('education-path', 'admin'), updateRequestStatus);

module.exports = router;
