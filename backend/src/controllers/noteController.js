const Note = require("../models/Note");

const STICKY_COLORS = ["yellow", "blue", "pink", "green", "purple", "orange"];

/**
 * POST /api/notes
 * Create sticky note or todo for the authenticated user.
 */
const createNote = async (req, res) => {
  try {
    const {
      type,
      title,
      description = "",
      color = "yellow",
      dueDate = null,
    } = req.body;

    if (!["sticky", "todo"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'sticky' or 'todo'",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (type === "sticky" && !STICKY_COLORS.includes(color)) {
      return res.status(400).json({
        success: false,
        message: `Color must be one of: ${STICKY_COLORS.join(", ")}`,
      });
    }

    const notePayload = {
      userId: req.user.id,
      type,
      title: title.trim(),
      description: description?.trim() || "",
      completed: false,
    };

    if (type === "sticky") {
      notePayload.color = color;
      notePayload.dueDate = null;
    } else {
      notePayload.dueDate = dueDate ? new Date(dueDate) : null;
      notePayload.color = "yellow";
    }

    const note = await Note.create(notePayload);

    return res.status(201).json({
      success: true,
      note,
      message: `${type === "sticky" ? "Sticky note" : "Todo"} created successfully`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/notes/sticky
 * Get all sticky notes for the authenticated user.
 */
const getStickyNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user.id,
      type: "sticky",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/notes/todos
 * Get all todo items for the authenticated user.
 */
const getTodos = async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user.id,
      type: "todo",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/notes/:id/complete
 * Toggle or set completed state of a todo.
 */
const toggleTodoCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const note = await Note.findOne({
      _id: id,
      userId: req.user.id,
      type: "todo",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Todo item not found",
      });
    }

    note.completed = typeof completed === "boolean" ? completed : !note.completed;
    note.updatedAt = new Date();
    await note.save();

    return res.json({
      success: true,
      note,
      message: "Todo status updated",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/notes/:id
 * Edit note fields for the authenticated user.
 */
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, color } = req.body;

    const note = await Note.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (typeof title === "string") {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }
      note.title = title.trim();
    }

    if (typeof description === "string") {
      note.description = description.trim();
    }

    if (note.type === "todo") {
      if (dueDate === null || dueDate === "") {
        note.dueDate = null;
      } else if (typeof dueDate === "string" || dueDate instanceof Date) {
        note.dueDate = new Date(dueDate);
      }
    }

    if (note.type === "sticky" && typeof color === "string") {
      if (!STICKY_COLORS.includes(color)) {
        return res.status(400).json({
          success: false,
          message: `Color must be one of: ${STICKY_COLORS.join(", ")}`,
        });
      }
      note.color = color;
    }

    note.updatedAt = new Date();
    await note.save();

    return res.json({
      success: true,
      note,
      message: `${note.type === "sticky" ? "Sticky note" : "Todo"} updated successfully`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/notes/:id
 * Delete note/todo for the authenticated user.
 */
const deleteNote = async (req, res) => {
  try {
    const deleted = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
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
