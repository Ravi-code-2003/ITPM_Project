import React, { useState, useEffect } from 'react';
import { X, StickyNote, CheckSquare } from 'lucide-react';
import Button from '../ui/Button';
import { notesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const NoteFormModal = ({ isOpen, onClose, editNote = null }) => {
  const [noteType, setNoteType] = useState('sticky'); // 'sticky' or 'todo'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: 'yellow',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (editNote) {
      setNoteType(editNote.type);
      setFormData({
        title: editNote.title || '',
        description: editNote.description || '',
        color: editNote.color || 'yellow',
        dueDate: editNote.dueDate ? new Date(editNote.dueDate).toISOString().split('T')[0] : '',
      });
    } else {
      // Reset form for new note
      setNoteType('sticky');
      setFormData({
        title: '',
        description: '',
        color: 'yellow',
        dueDate: '',
      });
    }
  }, [editNote, isOpen]);

  const handleTypeChange = (type) => {
    setNoteType(type);
    // Reset form when switching types (only for new notes)
    if (!editNote) {
      setFormData({
        title: '',
        description: '',
        color: 'yellow',
        dueDate: '',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: noteType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        ...(noteType === 'sticky' && { color: formData.color }),
        ...(noteType === 'todo' && formData.dueDate && { dueDate: formData.dueDate }),
      };

      if (editNote) {
        // Update existing note
        await notesAPI.updateNote(editNote._id, payload);
        toast.success(`${noteType === 'sticky' ? 'Sticky note' : 'Todo'} updated successfully!`);
      } else {
        // Create new note
        await notesAPI.createNote(payload);
        toast.success(`${noteType === 'sticky' ? 'Sticky note' : 'Todo'} created successfully!`);
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        color: 'yellow',
        dueDate: '',
      });
      onClose();

      // Trigger a page refresh or state update to show changes
      window.location.reload();

    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(`Failed to ${editNote ? 'update' : 'create'} note. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editNote ? 'Edit Note' : 'Create New Note'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleTypeChange('sticky')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                noteType === 'sticky'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <StickyNote className="h-4 w-4" />
              Sticky Note
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('todo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                noteType === 'todo'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              Todo
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {noteType === 'sticky' ? 'Note Title' : 'Task Title'} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={noteType === 'sticky' ? 'Enter note title...' : 'Enter task title...'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={noteType === 'sticky' ? 'Enter note details...' : 'Enter task details...'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Color (for sticky notes) */}
          {noteType === 'sticky' && (
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="yellow">Yellow</option>
                <option value="blue">Blue</option>
                <option value="pink">Pink</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="orange">Orange</option>
              </select>
            </div>
          )}

          {/* Due Date (for todos) */}
          {noteType === 'todo' && (
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (editNote ? 'Updating...' : 'Creating...') : `${editNote ? 'Update' : 'Create'} ${noteType === 'sticky' ? 'Note' : 'Todo'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteFormModal;