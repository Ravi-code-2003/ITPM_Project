import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Edit } from 'lucide-react';
import { notesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import NoteFormModal from './NoteFormModal';

const StickyNotesBoard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStickyNotes();
  }, []);

  const fetchStickyNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getStickyNotes();
      setNotes(response.notes || []);
    } catch (error) {
      console.error('Error fetching sticky notes:', error);
      toast.error('Failed to load sticky notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this sticky note?')) {
      return;
    }

    try {
      await notesAPI.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note._id !== noteId));
      toast.success('Sticky note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete sticky note');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      yellow: 'bg-yellow-200 dark:bg-yellow-800 border-yellow-300 dark:border-yellow-700',
      blue: 'bg-blue-200 dark:bg-blue-800 border-blue-300 dark:border-blue-700',
      pink: 'bg-pink-200 dark:bg-pink-800 border-pink-300 dark:border-pink-700',
      green: 'bg-green-200 dark:bg-green-800 border-green-300 dark:border-green-700',
      purple: 'bg-purple-200 dark:bg-purple-800 border-purple-300 dark:border-purple-700',
      orange: 'bg-orange-200 dark:bg-orange-800 border-orange-300 dark:border-orange-700',
    };
    return colorMap[color] || colorMap.yellow;
  };

  if (loading) {
    return (
      <section className="p-4 bg-gray-50 dark:bg-gray-900 shadow rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Sticky Notes</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading notes...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="p-4 bg-gray-50 dark:bg-gray-900 shadow rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Sticky Notes</h2>

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">No sticky notes yet. Create your first note!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className={`relative p-4 rounded-lg shadow-md border-2 transform hover:scale-105 transition-transform ${getColorClasses(note.color)}`}
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Edit note"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Note content */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 pr-6">
                  {note.title}
                </h3>

                {note.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                    {note.description}
                  </p>
                )}

                {/* Created date */}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-auto">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <NoteFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editNote={editingNote}
      />
    </>
  );
};

export default StickyNotesBoard;
