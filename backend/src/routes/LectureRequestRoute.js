const express = require('express');
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  updateMyRequest,
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
} = require('../controllers/LectureRequestController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student routes
router.post('/',       authorize('student'),               createRequest);
router.get('/',        authorize('student'),               getMyRequests);
router.patch('/:id',   authorize('student'),               updateMyRequest);
router.delete('/:id',  authorize('student'),               deleteRequest);

// Education provider routes
router.get('/all',     authorize('education-path', 'admin'), getAllRequests);
router.put('/:id',     authorize('education-path', 'admin'), updateRequestStatus);

module.exports = router;
