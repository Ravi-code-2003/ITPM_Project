const LectureMaterial = require('../models/EducationModel');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const FILE_TYPES = ['pdf', 'tute', 'pastpaper'];
const LINK_TYPES = ['youtube', 'drive'];

// POST /api/education/materials
const addMaterial = async (req, res) => {
  try {
    const { title, description, type, linkUrl, course, isImportant } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!type || !['pdf', 'tute', 'pastpaper', 'youtube', 'drive'].includes(type)) {
      return res.status(400).json({ message: 'Invalid material type' });
    }

    const materialData = {
      title: title.trim(),
      description: description?.trim() || '',
      type,
      course: course?.trim() || '',
      isImportant: isImportant === true || isImportant === 'true',
      uploadedBy: req.user._id,
    };

    if (FILE_TYPES.includes(type)) {
      if (!req.file) {
        return res.status(400).json({ message: 'A PDF file is required for this material type' });
      }
      materialData.fileUrl = `/uploads/${req.file.filename}`;
      materialData.fileName = req.file.originalname;
      materialData.fileSize = req.file.size;
    }

    if (LINK_TYPES.includes(type)) {
      if (!linkUrl || !linkUrl.trim()) {
        return res.status(400).json({ message: 'A link URL is required for this material type' });
      }
      materialData.linkUrl = linkUrl.trim();
    }

    const material = await LectureMaterial.create(materialData);
    res.status(201).json({ success: true, material });
  } catch (error) {
    console.error('addMaterial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/education/materials  (own materials — for education provider dashboard)
const getMaterials = async (req, res) => {
  try {
    const materials = await LectureMaterial.find({ uploadedBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, materials });
  } catch (error) {
    console.error('getMaterials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/education/materials/all  (all materials — public view for students)
const getAllMaterials = async (req, res) => {
  try {
    const materials = await LectureMaterial.find({})
      .populate('uploadedBy', 'fullName organizationName')
      .sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (error) {
    console.error('getAllMaterials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/education/materials/:id
const updateMaterial = async (req, res) => {
  try {
    const material = await LectureMaterial.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const { title, description, course, linkUrl, isImportant } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }
      material.title = title.trim();
    }

    if (description !== undefined) {
      material.description = description?.trim() || '';
    }

    if (course !== undefined) {
      material.course = course?.trim() || '';
    }

    if (isImportant !== undefined) {
      material.isImportant = isImportant === true || isImportant === 'true';
    }

    if (LINK_TYPES.includes(material.type) && linkUrl !== undefined) {
      if (!linkUrl || !linkUrl.trim()) {
        return res.status(400).json({ message: 'A link URL is required for this material type' });
      }
      material.linkUrl = linkUrl.trim();
    }

    await material.save();
    res.json({ success: true, material });
  } catch (error) {
    console.error('updateMaterial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/education/materials/:id
const deleteMaterial = async (req, res) => {
  try {
    const material = await LectureMaterial.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Remove local file if it exists
    if (material.fileUrl) {
      const filePath = path.join(__dirname, '../..', material.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await material.deleteOne();
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('deleteMaterial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/education/materials/:id/important  — toggle isImportant flag
const toggleImportant = async (req, res) => {
  try {
    const material = await LectureMaterial.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    material.isImportant = !material.isImportant;
    await material.save();
    res.json({ success: true, isImportant: material.isImportant });
  } catch (error) {
    console.error('toggleImportant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/education/student-count  — total registered students
const getStudentCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'student' });
    res.json({ success: true, count });
  } catch (error) {
    console.error('getStudentCount error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addMaterial,
  getMaterials,
  getAllMaterials,
  updateMaterial,
  deleteMaterial,
  getStudentCount,
  toggleImportant,
};

