import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ListTodo,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { todoService } from '../services/todoService';

const TodoListPage = () => {
  const navigate = useNavigate();
  const [todosLoading, setTodosLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [creatingTodo, setCreatingTodo] = useState(false);
  const [savingTodoId, setSavingTodoId] = useState('');
  const [deletingTodoId, setDeletingTodoId] = useState('');
  const [editingTodoId, setEditingTodoId] = useState('');

  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  const [editTodoDraft, setEditTodoDraft] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await todoService.getTodos();
        setTodos(Array.isArray(response.todos) ? response.todos : []);
      } catch (error) {
        console.error('Failed to fetch todos:', error);
        toast.error('Failed to load todos. Please refresh.');
      } finally {
        setTodosLoading(false);
      }
    };

    fetchTodos();
  }, []);

  const handleCreateTodo = async (event) => {
    event.preventDefault();

    const payload = {
      title: newTodo.title.trim(),
      description: newTodo.description.trim(),
      priority: newTodo.priority,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).toISOString() : null,
    };

    if (!payload.title) {
      toast.error('Please add a todo title.');
      return;
    }

    try {
      setCreatingTodo(true);
      const response = await todoService.createTodo(payload);
      const created = response.todo;

      setTodos((prev) => [created, ...prev]);
      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '' });
      toast.success('Todo created.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create todo.';
      toast.error(message);
    } finally {
      setCreatingTodo(false);
    }
  };

  const handleToggleTodo = async (todoId) => {
    try {
      setSavingTodoId(todoId);
      const response = await todoService.toggleTodo(todoId);
      const updated = response.todo;

      setTodos((prev) => prev.map((item) => (item._id === todoId ? updated : item)));
      toast.success(updated.completed ? 'Todo marked done.' : 'Todo marked incomplete.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to toggle todo.';
      toast.error(message);
    } finally {
      setSavingTodoId('');
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodoId(todo._id);
    setEditTodoDraft({
      title: todo.title || '',
      description: todo.description || '',
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
    });
  };

  const cancelEditTodo = () => {
    setEditingTodoId('');
    setEditTodoDraft({ title: '', description: '', priority: 'medium', dueDate: '' });
  };

  const handleSaveEditTodo = async (todoId) => {
    const payload = {
      title: editTodoDraft.title.trim(),
      description: editTodoDraft.description.trim(),
      priority: editTodoDraft.priority,
      dueDate: editTodoDraft.dueDate ? new Date(editTodoDraft.dueDate).toISOString() : null,
    };

    if (!payload.title) {
      toast.error('Todo title cannot be empty.');
      return;
    }

    try {
      setSavingTodoId(todoId);
      const response = await todoService.updateTodo(todoId, payload);
      const updated = response.todo;

      setTodos((prev) => prev.map((item) => (item._id === todoId ? updated : item)));
      cancelEditTodo();
      toast.success('Todo updated.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update todo.';
      toast.error(message);
    } finally {
      setSavingTodoId('');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    const confirmed = window.confirm('Delete this todo?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingTodoId(todoId);
      await todoService.deleteTodo(todoId);
      setTodos((prev) => prev.filter((item) => item._id !== todoId));

      if (editingTodoId === todoId) {
        cancelEditTodo();
      }

      toast.success('Todo deleted.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete todo.';
      toast.error(message);
    } finally {
      setDeletingTodoId('');
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-blue-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">My Todos</h1>
              <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">Manage and track your tasks</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {completedCount}/{todos.length} complete
          </div>
        </div>

        <Card className="border border-blue-200/80 dark:border-blue-900/40">
          <CardHeader className="mb-3">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-blue-600" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="rounded-2xl border border-dashed border-blue-300 dark:border-blue-700/70 p-4 bg-blue-50/70 dark:bg-slate-900/40">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(event) => setNewTodo((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Todo title..."
                  maxLength={150}
                  className="lg:col-span-5 rounded-xl border border-blue-300/70 dark:border-blue-700 bg-white/90 dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={newTodo.priority}
                  onChange={(event) => setNewTodo((prev) => ({ ...prev, priority: event.target.value }))}
                  className="lg:col-span-2 rounded-xl border border-blue-300/70 dark:border-blue-700 bg-white/90 dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(event) => setNewTodo((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="lg:col-span-2 rounded-xl border border-blue-300/70 dark:border-blue-700 bg-white/90 dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  disabled={creatingTodo}
                  className="lg:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 transition-colors disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {creatingTodo ? 'Adding...' : 'Add Todo'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          {todosLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : todos.length === 0 ? (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 p-8 text-center text-secondary dark:text-gray-400 bg-white/80 dark:bg-slate-900/30">
              No todos yet. Add your first todo above to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo, index) => {
                const isEditing = editingTodoId === todo._id;
                const priorityColor = {
                  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                }[todo.priority] || 'bg-gray-100 text-gray-700';

                return (
                  <div
                    key={todo._id || `todo-${index}`}
                    className={`border rounded-lg p-4 transition-all ${
                      todo.completed
                        ? 'bg-gray-100 dark:bg-gray-800 opacity-60'
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTodoDraft.title}
                          onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="Todo title"
                          className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-sm focus:outline-none"
                        />
                        <textarea
                          value={editTodoDraft.description}
                          onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, description: event.target.value }))}
                          placeholder="Description (optional)"
                          rows={3}
                          className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-sm focus:outline-none resize-y"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editTodoDraft.priority}
                            onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, priority: event.target.value }))}
                            className="flex-1 rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-sm focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <input
                            type="date"
                            value={editTodoDraft.dueDate}
                            onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                            className="flex-1 rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditTodo}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-current/40 text-xs font-semibold"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditTodo(todo._id)}
                            disabled={savingTodoId === todo._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-semibold disabled:opacity-60"
                          >
                            <Save className="h-3.5 w-3.5" />
                            {savingTodoId === todo._id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleTodo(todo._id)}
                            disabled={savingTodoId === todo._id}
                            className="mt-1 h-5 w-5 cursor-pointer rounded disabled:opacity-60"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-lg ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className="text-sm text-secondary dark:text-gray-400 mt-1">{todo.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${priorityColor}`}>
                                {todo.priority}
                              </span>
                              {todo.dueDate && (
                                <span className="text-xs text-secondary dark:text-gray-400">
                                  Due: {new Date(todo.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditTodo(todo)}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                              aria-label="Edit todo"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo._id)}
                              disabled={deletingTodoId === todo._id}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-red-500/15 transition-colors disabled:opacity-60"
                              aria-label="Delete todo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoListPage;
