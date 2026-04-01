const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createNote,
  getStickyNotes,
  getTodos,
  toggleTodoCompletion,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create a new note or todo
router.post("/", createNote);

// Get sticky notes for authenticated user
router.get("/sticky", getStickyNotes);

// Get todos for authenticated user
router.get("/todos", getTodos);

// Toggle todo completion status
router.patch("/:id/complete", toggleTodoCompletion);

// Update a note or todo
router.patch("/:id", updateNote);

// Delete a note or todo
router.delete("/:id", deleteNote);

module.exports = router;
