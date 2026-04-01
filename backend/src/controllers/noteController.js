const Note = require('../models/Note');
const Joi = require('joi');

// Validation schemas
const createNoteSchema = Joi.object({
  type: Joi.string().valid('sticky', 'todo').required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  color: Joi.string().valid('yellow', 'blue', 'pink', 'green', 'purple', 'orange').optional(),
  dueDate: Joi.date().optional(),
});

const updateTodoSchema = Joi.object({
  completed: Joi.boolean().required(),
});

// Create a new note or todo
const createNote = async (req, res) => {
  try {
    const { error, value } = createNoteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message,
      });
    }

    // Add userId from authenticated user
    const noteData = {
      ...value,
      userId: req.user._id,
    };

    // Set defaults based on type
    if (noteData.type === 'sticky') {
      noteData.color = noteData.color || 'yellow';
      noteData.completed = false; // Sticky notes are never completed
    } else if (noteData.type === 'todo') {
      noteData.completed = false; // Todos start incomplete
    }

    const note = new Note(noteData);
    await note.save();

    res.status(201).json({
      success: true,
      message: `${noteData.type === 'sticky' ? 'Sticky note' : 'Todo'} created successfully`,
      note,
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating note',
    });
  }
};

// Get all sticky notes for the authenticated user
const getStickyNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user._id,
      type: 'sticky',
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error('Get sticky notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sticky notes',
    });
  }
};

// Get all todos for the authenticated user
const getTodos = async (req, res) => {
  try {
    const todos = await Note.find({
      userId: req.user._id,
      type: 'todo',
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      todos,
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching todos',
    });
  }
};

// Toggle todo completion status
const toggleTodoCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTodoSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message,
      });
    }

    // Find and update the todo, ensuring it belongs to the user
    const todo = await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id, type: 'todo' },
      { completed: value.completed },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or access denied',
      });
    }

    res.json({
      success: true,
      message: `Todo ${value.completed ? 'completed' : 'marked incomplete'}`,
      todo,
    });
  } catch (error) {
    console.error('Toggle todo completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating todo',
    });
  }
};

// Update a note or todo
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = createNoteSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message,
      });
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      value,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied',
      });
    }

    res.json({
      success: true,
      message: `${note.type === 'sticky' ? 'Sticky note' : 'Todo'} updated successfully`,
      note,
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating note',
    });
  }
};

// Delete a note or todo
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied',
      });
    }

    res.json({
      success: true,
      message: `${note.type === 'sticky' ? 'Sticky note' : 'Todo'} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting note',
    });
  }
};

module.exports = {
  createNote,
  getStickyNotes,
  getTodos,
  toggleTodoCompletion,
  updateNote,
  deleteNote,
};