const express = require('express');
const router = express.Router();

const {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} = require('../controllers/ProgramController');

const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/', getPrograms);
router.get('/:id', getProgramById);

// Protected — education provider or admin
router.post('/',       protect, authorize('education-path', 'admin'), createProgram);
router.put('/:id',    protect, authorize('education-path', 'admin'), updateProgram);
router.delete('/:id', protect, authorize('education-path', 'admin'), deleteProgram);

module.exports = router;
