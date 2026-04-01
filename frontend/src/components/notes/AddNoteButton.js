import React, { useState } from 'react';
import { Plus, FileText, CheckSquare } from 'lucide-react';
import Button from '../ui/Button';
import NoteFormModal from './NoteFormModal';

const AddNoteButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Notes</span>
        <span className="sm:hidden">Jot Down</span>
      </Button>

      {isModalOpen && (
        <NoteFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default AddNoteButton;