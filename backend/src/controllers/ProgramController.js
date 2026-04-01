const EducationProgram = require('../models/EducationProgram');

// GET /api/education/programs  — public, anyone can view
const getPrograms = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { provider:    { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }

    const programs = await EducationProgram.find(filter).sort({ createdAt: -1 });
    const categories = await EducationProgram.distinct('category', { isActive: true });

    res.json({ success: true, programs, categories: ['All', ...categories.sort()] });
  } catch (error) {
    console.error('getPrograms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/education/programs/:id
const getProgramById = async (req, res) => {
  try {
    const program = await EducationProgram.findById(req.params.id);
    if (!program || !program.isActive) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json({ success: true, program });
  } catch (error) {
    console.error('getProgramById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/education/programs  — education provider / admin only
const createProgram = async (req, res) => {
  try {
    const { title, category, provider, duration, level, price, description, image, tags } = req.body;

    if (!title || !category || !provider || !duration || !level || !description) {
      return res.status(400).json({ message: 'Title, category, provider, duration, level and description are required' });
    }

    const program = await EducationProgram.create({
      title: title.trim(),
      category: category.trim(),
      provider: provider.trim(),
      duration: duration.trim(),
      level,
      price: price?.trim() || 'Free',
      description: description.trim(),
      image: image?.trim() || '',
      tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, program });
  } catch (error) {
    console.error('createProgram error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/education/programs/:id  — education provider (own) / admin
const updateProgram = async (req, res) => {
  try {
    const program = await EducationProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const allowed = ['title','category','provider','duration','level','price','description','image','tags','isActive'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) program[field] = req.body[field];
    });

    await program.save();
    res.json({ success: true, program });
  } catch (error) {
    console.error('updateProgram error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/education/programs/:id  — education provider (own) / admin
const deleteProgram = async (req, res) => {
  try {
    const program = await EducationProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    await program.deleteOne();
    res.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    console.error('deleteProgram error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram };
