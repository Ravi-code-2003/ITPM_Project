import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { notesAPI } from "../../services/api";
import Button from "../ui/Button";
import "./notes.css";

const STICKY_COLORS = ["yellow", "blue", "pink", "green", "purple", "orange"];

const NoteFormModal = ({
  isOpen,
  onClose,
  onCreated,
  defaultType = "sticky",
}) => {
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("yellow");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setTitle("");
      setDescription("");
      setColor("yellow");
      setDueDate("");
    }
  }, [isOpen, defaultType]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const payload = {
      type,
      title: title.trim(),
      description: description.trim(),
    };

    if (type === "sticky") {
      payload.color = color;
    } else if (dueDate) {
      payload.dueDate = dueDate;
    }

    try {
      setSubmitting(true);
      const response = await notesAPI.createNote(payload);
      onCreated?.(response.note);
      toast.success(`${type === "sticky" ? "Sticky note" : "Todo"} added`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="notes-modal-overlay" onClick={onClose}>
      <div className="notes-modal dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-3">Jot Down</h3>

        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 p-1 mb-4">
          <button
            type="button"
            onClick={() => setType("sticky")}
            className={`px-3 py-1.5 text-sm rounded-md ${type === "sticky" ? "bg-primary text-white" : "text-secondary dark:text-gray-300"}`}
          >
            Sticky Note
          </button>
          <button
            type="button"
            onClick={() => setType("todo")}
            className={`px-3 py-1.5 text-sm rounded-md ${type === "todo" ? "bg-primary text-white" : "text-secondary dark:text-gray-300"}`}
          >
            Todo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-primary dark:text-gray-100 mb-1">
              {type === "sticky" ? "Title" : "Task title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder={type === "sticky" ? "E.g. Reminder" : "E.g. Submit assignment"}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary dark:text-gray-100 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write details..."
              rows={3}
              maxLength={500}
            />
          </div>

          {type === "sticky" ? (
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-100 mb-1">Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {STICKY_COLORS.map((c) => (
                  <option value={c} key={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-100 mb-1">Due date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteFormModal;
