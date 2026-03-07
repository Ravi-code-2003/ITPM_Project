import React, { useEffect, useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { notesAPI } from "../../services/api";
import AddNoteButton from "./AddNoteButton";
import NoteFormModal from "./NoteFormModal";
import "./notes.css";

const colorClassMap = {
  yellow: "note-card-yellow",
  blue: "note-card-blue",
  pink: "note-card-pink",
  green: "note-card-green",
  purple: "note-card-purple",
  orange: "note-card-orange",
};

const StickyNotesBoard = () => {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStickyNotes();
  }, [isAuthenticated]);

  const fetchStickyNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getStickyNotes();
      setNotes(response.notes || []);
    } catch (error) {
      console.error("Failed to load sticky notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (note) => {
    // Update sticky board immediately when a sticky note is created.
    if (note?.type === "sticky") {
      setNotes((prev) => [note, ...prev]);
    }

    // Notify other note widgets (e.g. TodoTable) to update.
    window.dispatchEvent(new CustomEvent("note:created", { detail: { note } }));
  };

  const handleDelete = async (id) => {
    try {
      await notesAPI.deleteNote(id);
      setNotes((prev) => prev.filter((note) => note._id !== id));
      toast.success("Sticky note deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete note");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="border-b border-yellow-200/60 dark:border-yellow-700/40 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary dark:text-gray-100 font-semibold">
            <StickyNote className="h-5 w-5" />
            Sticky Notes
          </div>
          <AddNoteButton label="Add Notes" onClick={() => setIsModalOpen(true)} />
        </div>

        {loading ? (
          <p className="text-sm text-secondary dark:text-gray-300">Loading sticky notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-secondary dark:text-gray-300">No sticky notes yet. Click Add Notes to create one.</p>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note._id} className={`note-card ${colorClassMap[note.color] || "note-card-yellow"}`}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-semibold text-sm text-gray-900">{note.title}</h4>
                  <button
                    type="button"
                    onClick={() => handleDelete(note._id)}
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {note.description && (
                  <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap break-words">{note.description}</p>
                )}
                <p className="text-xs text-gray-700 mt-3">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <NoteFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
          defaultType="sticky"
        />
      </div>
    </section>
  );
};

export default StickyNotesBoard;
