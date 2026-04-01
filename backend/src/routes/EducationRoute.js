const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  addMaterial,
  getMaterials,
  getAllMaterials,
  updateMaterial,
  deleteMaterial,
  getStudentCount,
  toggleImportant,
} = require('../controllers/EducationController');
const { protect, authorize } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: pdfFilter,
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum allowed size is 10MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err && err.message === 'Only PDF files are allowed!') {
    return res.status(400).json({ message: 'Only PDF files are allowed!' });
  }
  next(err);
};

// Public — all students can browse all uploaded materials (no auth required)
router.get('/all', getAllMaterials);

// GET total registered student count (education provider dashboard)
router.get('/student-count', protect, getStudentCount);

// GET own materials — education provider dashboard only
router.get('/', protect, getMaterials);

// POST and DELETE require education-path or admin role
router.post('/',       protect, authorize('education-path', 'admin'), uploadPDF.single('file'), handleMulterError, addMaterial);
router.patch('/:id', protect, authorize('education-path', 'admin'), updateMaterial);
router.patch('/:id/important', protect, authorize('education-path', 'admin'), toggleImportant);
router.delete('/:id',  protect, authorize('education-path', 'admin'), deleteMaterial);

module.exports = router;
