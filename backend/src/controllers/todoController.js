const mongoose = require("mongoose");
const Todo = require("../models/Todo");

const getStudentId = (req) => req.user?._id || req.user?.id;

const normalizeTodoPayload = (payload = {}) => {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const priority = typeof payload.priority === "string" ? payload.priority.trim().toLowerCase() : "medium";
  const dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  const completed = typeof payload.completed === "boolean" ? payload.completed : false;

  return {
    title,
    description,
    priority,
    dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null,
    completed,
  };
};

const validatePriority = (priority) => ["low", "medium", "high"].includes(priority);

const getTodos = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { completed } = req.query;

    const query = { studentId };
    if (typeof completed === "string") {
      query.completed = completed === "true";
    }

    const todos = await Todo.find(query)
      .sort({ completed: 1, dueDate: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      todos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load todos",
      error: error.message,
    });
  }
};

const createTodo = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(401).json({
        success: false,
        message: "Invalid student session. Please log in again.",
      });
    }

    const { title, description, priority, dueDate, completed } = normalizeTodoPayload(req.body);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Todo title is required",
      });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
      });
    }

    const todo = await Todo.create({
      studentId,
      title,
      description,
      priority,
      dueDate,
      completed,
    });

    return res.status(201).json({
      success: true,
      todo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create todo",
      error: error.message,
    });
  }
};

const updateTodo = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo id",
      });
    }

    const existing = await Todo.findOne({ _id: id, studentId });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    const { title, description, priority, dueDate, completed } = normalizeTodoPayload(req.body);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Todo title is required",
      });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
      });
    }

    existing.title = title;
    existing.description = description;
    existing.priority = priority;
    existing.dueDate = dueDate;
    existing.completed = completed;

    await existing.save();

    return res.json({
      success: true,
      todo: existing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update todo",
      error: error.message,
    });
  }
};

const toggleTodoCompletion = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo id",
      });
    }

    const todo = await Todo.findOne({ _id: id, studentId });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    todo.completed = !todo.completed;
    await todo.save();

    return res.json({
      success: true,
      todo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle todo completion",
      error: error.message,
    });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo id",
      });
    }

    const deleted = await Todo.findOneAndDelete({ _id: id, studentId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.json({
      success: true,
      message: "Todo deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete todo",
      error: error.message,
    });
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodoCompletion,
  deleteTodo,
};
