import React, { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { notesAPI } from "../../services/api";
import AddNoteButton from "./AddNoteButton";
import NoteFormModal from "./NoteFormModal";
import "./notes.css";

const TodoTable = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchTodos();

    const onCreated = (event) => {
      if (event.detail?.note?.type === "todo") {
        setTodos((prev) => [event.detail.note, ...prev]);
      }
    };

    window.addEventListener("note:created", onCreated);
    return () => window.removeEventListener("note:created", onCreated);
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getTodos();
      setTodos(response.notes || []);
    } catch (error) {
      toast.error("Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (note) => {
    if (note?.type === "todo") {
      setTodos((prev) => [note, ...prev]);
    }
    window.dispatchEvent(new CustomEvent("note:created", { detail: { note } }));
  };

  const toggleCompleted = async (todo) => {
    try {
      const response = await notesAPI.toggleTodoCompletion(todo._id, !todo.completed);
      setTodos((prev) => prev.map((t) => (t._id === todo._id ? response.note : t)));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update todo");
    }
  };

  const removeTodo = async (id) => {
    try {
      await notesAPI.deleteNote(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
      toast.success("Todo deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete todo");
    }
  };

  const startEdit = (todo) => {
    setEditingTodoId(todo._id);
    setEditForm({
      title: todo.title || "",
      description: todo.description || "",
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : "",
    });
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditForm({ title: "", description: "", dueDate: "" });
  };

  const saveEdit = async (todoId) => {
    if (!editForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      const response = await notesAPI.updateTodo(todoId, {
        title: editForm.title,
        description: editForm.description,
        dueDate: editForm.dueDate || null,
      });

      setTodos((prev) => prev.map((t) => (t._id === todoId ? response.note : t)));
      toast.success("Todo updated");
      cancelEdit();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update todo");
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-primary dark:text-gray-100">Todo Items</h4>
        <AddNoteButton label="Jot Down" onClick={() => setIsModalOpen(true)} />
      </div>

      {loading ? (
        <p className="text-sm text-secondary dark:text-gray-400">Loading todos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Done</th>
                <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Task</th>
                <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Description</th>
                <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Due Date</th>
                <th className="text-left py-2 font-semibold text-primary dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todos.map((todo) => (
                <tr key={todo._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={!!todo.completed}
                      onChange={() => toggleCompleted(todo)}
                      className="h-4 w-4 accent-primary"
                      disabled={editingTodoId === todo._id}
                    />
                  </td>
                  {editingTodoId === todo._id ? (
                    <>
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                          maxLength={120}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                          maxLength={500}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={`py-2 pr-3 ${todo.completed ? "line-through text-gray-400" : "text-secondary dark:text-gray-300"}`}>
                        {todo.title}
                      </td>
                      <td className={`py-2 pr-3 ${todo.completed ? "line-through text-gray-400" : "text-secondary dark:text-gray-300"}`}>
                        {todo.description || "-"}
                      </td>
                      <td className={`py-2 pr-3 ${todo.completed ? "line-through text-gray-400" : "text-secondary dark:text-gray-300"}`}>
                        {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : "-"}
                      </td>
                    </>
                  )}
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {editingTodoId === todo._id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(todo._id)}
                            className="text-green-600 hover:text-green-700"
                            title="Save todo"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-700"
                            title="Cancel edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(todo)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit todo"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTodo(todo._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete todo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {todos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-secondary dark:text-gray-400">
                    No todo items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <NoteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
        defaultType="todo"
      />
    </div>
  );
};

export default TodoTable;
