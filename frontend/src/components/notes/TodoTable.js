import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Check, Edit } from 'lucide-react';
import { notesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import NoteFormModal from './NoteFormModal';

const TodoTable = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTodo, setEditingTodo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getTodos();
      setTodos(response.todos || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (todoId, currentCompleted) => {
    try {
      await notesAPI.toggleTodoCompletion(todoId, !currentCompleted);
      setTodos(prev =>
        prev.map(todo =>
          todo._id === todoId ? { ...todo, completed: !currentCompleted } : todo
        )
      );
      toast.success(`Todo ${!currentCompleted ? 'completed' : 'marked incomplete'}`);
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    try {
      await notesAPI.deleteNote(todoId);
      setTodos(prev => prev.filter(todo => todo._id !== todoId));
      toast.success('Todo deleted successfully');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Todo List</h3>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading todos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Todo List</h3>

        {todos.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No todos yet. Create your first todo!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Done</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Task</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Description</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Due Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {todos.map((todo) => (
                  <tr
                    key={todo._id}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      todo.completed ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleComplete(todo._id, todo.completed)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                        }`}
                      >
                        {todo.completed && <Check className="h-3 w-3" />}
                      </button>
                    </td>

                    {/* Task Title */}
                    <td className="py-3 px-3">
                      <span
                        className={`font-medium ${
                          todo.completed
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {todo.title}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3">
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {todo.description || '-'}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-3">
                      {todo.dueDate ? (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(todo.dueDate)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                          title="Edit todo"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title="Delete todo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <NoteFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editNote={editingTodo}
      />
    </>
  );
};

export default TodoTable;
