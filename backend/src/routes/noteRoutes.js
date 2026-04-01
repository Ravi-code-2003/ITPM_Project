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

router.use(protect);

router.post("/", createNote);
router.get("/sticky", getStickyNotes);
router.get("/todos", getTodos);
router.patch("/:id/complete", toggleTodoCompletion);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;
