import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  ListTodo,
  MapPin,
  Pencil,
  Plus,
  Search,
  Save,
  StickyNote,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomRequestService } from '../../services/accommodationService';
import { stickyNotesService } from '../../services/stickyNotesService';
import { todoService } from '../../services/todoService';

const normalizeRequests = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object');
};

const normalizeNotes = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object');
};

const NOTE_COLORS = [
  { value: 'amber', label: 'Amber', classes: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-100' },
  { value: 'sky', label: 'Sky', classes: 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-900/20 dark:border-sky-700 dark:text-sky-100' },
  { value: 'rose', label: 'Rose', classes: 'bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-900/20 dark:border-rose-700 dark:text-rose-100' },
  { value: 'mint', label: 'Mint', classes: 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-100' },
  { value: 'lavender', label: 'Lavender', classes: 'bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-100' },
];

const getNoteColorClasses = (color) => {
  const match = NOTE_COLORS.find((item) => item.value === color);
  return match?.classes || NOTE_COLORS[0].classes;
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
};

const StudentDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [noteSearch, setNoteSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [editingId, setEditingId] = useState('');

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: 'amber',
  });

  const [editDraft, setEditDraft] = useState({
    title: '',
    content: '',
    color: 'amber',
  });

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
    const fetchDashboardData = async () => {
      try {
        const [requestsResponse, notesResponse] = await Promise.all([
          roomRequestService.getStudentRequests(),
          stickyNotesService.getNotes(),
        ]);

        setRequests(normalizeRequests(requestsResponse.data));
        setNotes(normalizeNotes(notesResponse.notes));
        const todosResponse = await todoService.getTodos();
        setTodos(Array.isArray(todosResponse.todos) ? todosResponse.todos : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data. Please refresh.');
      }

      setActivityLoading(false);
      setNotesLoading(false);
      setTodosLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleCreateNote = async (event) => {
    event.preventDefault();

    const payload = {
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      color: newNote.color,
    };

    if (!payload.content) {
      toast.error('Please add some note content.');
      return;
    }

    try {
      setCreating(true);
      const response = await stickyNotesService.createNote(payload);
      const created = response.note;

      setNotes((prev) => [created, ...prev]);
      setNewNote({ title: '', content: '', color: payload.color });
      toast.success('Sticky note created.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create sticky note.';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setEditDraft({
      title: note.title || '',
      content: note.content || '',
      color: note.color || 'amber',
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditDraft({ title: '', content: '', color: 'amber' });
  };

  const handleSaveEdit = async (noteId) => {
    const payload = {
      title: editDraft.title.trim(),
      content: editDraft.content.trim(),
      color: editDraft.color,
    };

    if (!payload.content) {
      toast.error('Note content cannot be empty.');
      return;
    }

    try {
      setSavingId(noteId);
      const response = await stickyNotesService.updateNote(noteId, payload);
      const updated = response.note;

      setNotes((prev) => prev.map((item) => (item._id === noteId ? updated : item)));
      cancelEdit();
      toast.success('Sticky note updated.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update sticky note.';
      toast.error(message);
    } finally {
      setSavingId('');
    }
  };

  const handleDelete = async (noteId) => {
    const confirmed = window.confirm('Delete this sticky note?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(noteId);
      await stickyNotesService.deleteNote(noteId);
      setNotes((prev) => prev.filter((item) => item._id !== noteId));

      if (editingId === noteId) {
        cancelEdit();
      }

      toast.success('Sticky note deleted.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete sticky note.';
      toast.error(message);
    } finally {
      setDeletingId('');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'ACCEPTED') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const filteredNotes = notes.filter((note) => {
    const title = (note?.title || '').toLowerCase();
    return title.includes(noteSearch.trim().toLowerCase());
  });

  const handleTopToolClick = (tool) => {
    if (tool === 'todo') {
      const todoSection = document.getElementById('todo-list-section');
      if (todoSection) {
        todoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tool === 'lost-found') {
      toast.info('Lost & Found coming soon!');
    }
  };

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

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">Explore services and opportunities</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleTopToolClick('sticky-notes')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-colors bg-amber-500 text-white border-amber-500"
          >
            <StickyNote className="h-4 w-4" />
            Sticky Notes
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('todo')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-colors bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <ListTodo className="h-4 w-4" />
            ToDo List
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('lost-found')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-colors bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <Search className="h-4 w-4" />
            Lost &amp; Found
          </button>
        </div>

        <Card className="mb-8 border border-amber-200/80 dark:border-amber-900/40 bg-white/95 dark:bg-surface-dark/90 shadow-xl">
          <CardHeader className="mb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-amber-600" />
                  Sticky Notes
                </CardTitle>
                <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                  Keep quick reminders, to-dos, and study thoughts in one place.
                </p>
              </div>
              <div className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {notes.length} note{notes.length === 1 ? '' : 's'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNote} className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/70 p-3 sm:p-4 mb-5 bg-amber-50/70 dark:bg-slate-900/40">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(event) => setNewNote((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Title (optional)"
                  maxLength={80}
                  className="lg:col-span-4 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={newNote.color}
                  onChange={(event) => setNewNote((prev) => ({ ...prev, color: event.target.value }))}
                  className="lg:col-span-2 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {NOTE_COLORS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <textarea
                  value={newNote.content}
                  onChange={(event) => setNewNote((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Write your note..."
                  maxLength={1000}
                  rows={1}
                  className="lg:col-span-4 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs leading-5 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="lg:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>

            <div className="mb-4">
              <input
                type="text"
                value={noteSearch}
                onChange={(event) => setNoteSearch(event.target.value)}
                placeholder="Search notes by title..."
                className="w-full sm:w-80 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {notesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 p-6 text-center text-secondary dark:text-gray-400 bg-white/80 dark:bg-slate-900/30">
                No sticky notes yet. Add your first note above.
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 p-6 text-center text-secondary dark:text-gray-400 bg-white/80 dark:bg-slate-900/30">
                No sticky notes found for that title.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory">
                {filteredNotes.map((note, index) => {
                  const isEditing = editingId === note._id;
                  const twistClass = ['rotate-0', 'md:-rotate-1', 'md:rotate-1'][index % 3];

                  return (
                    <article
                      key={note._id || `note-${index}`}
                      className={`border rounded-xl p-3 shadow-sm transition-all hover:shadow-md flex flex-col min-w-[220px] max-w-[220px] snap-start ${getNoteColorClasses(note.color)} ${twistClass}`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editDraft.title}
                            onChange={(event) => setEditDraft((prev) => ({ ...prev, title: event.target.value }))}
                            placeholder="Title (optional)"
                            className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                          <select
                            value={editDraft.color}
                            onChange={(event) => setEditDraft((prev) => ({ ...prev, color: event.target.value }))}
                            className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none"
                          >
                            {NOTE_COLORS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <textarea
                            value={editDraft.content}
                            onChange={(event) => setEditDraft((prev) => ({ ...prev, content: event.target.value }))}
                            rows={3}
                            className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none resize-y"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-current/40 text-[11px] font-semibold"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(note._id)}
                              disabled={savingId === note._id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-semibold disabled:opacity-60"
                            >
                              <Save className="h-3.5 w-3.5" />
                              {savingId === note._id ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg break-words leading-tight">
                              {note.title || 'Untitled Note'}
                            </h3>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(note)}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                aria-label="Edit note"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(note._id)}
                                disabled={deletingId === note._id}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-red-500/15 transition-colors disabled:opacity-60"
                                aria-label="Delete note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs mt-1.5 whitespace-pre-wrap break-words leading-relaxed max-h-24 overflow-y-auto pr-1">
                            {note.content}
                          </p>
                          <p className="text-[10px] mt-2 opacity-80">Updated: {formatDateTime(note.updatedAt)}</p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
                <Card id="todo-list-section" className="mb-8 border border-amber-200/80 dark:border-amber-900/40 bg-white/95 dark:bg-surface-dark/90 shadow-xl">
                  <CardHeader className="mb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ListTodo className="h-5 w-5 text-amber-600" />
                          My Todos
                        </CardTitle>
                        <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                          Manage your tasks and stay organized.
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {todos.length} todo{todos.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateTodo} className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/70 p-3 sm:p-4 mb-5 bg-amber-50/70 dark:bg-slate-900/40">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                        <input
                          type="text"
                          value={newTodo.title}
                          onChange={(event) => setNewTodo((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="Todo title..."
                          maxLength={150}
                          className="lg:col-span-5 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <select
                          value={newTodo.priority}
                          onChange={(event) => setNewTodo((prev) => ({ ...prev, priority: event.target.value }))}
                          className="lg:col-span-2 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <input
                          type="date"
                          value={newTodo.dueDate}
                          onChange={(event) => setNewTodo((prev) => ({ ...prev, dueDate: event.target.value }))}
                          className="lg:col-span-2 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <button
                          type="submit"
                          disabled={creatingTodo}
                          className="lg:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
                        >
                          <Plus className="h-4 w-4" />
                          {creatingTodo ? 'Adding...' : 'Add Todo'}
                        </button>
                      </div>
                    </form>

                    {todosLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                      </div>
                    ) : todos.length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 p-6 text-center text-secondary dark:text-gray-400 bg-white/80 dark:bg-slate-900/30">
                        No todos yet. Add your first todo above.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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
                              className={`border rounded-lg p-3 transition-all ${todo.completed ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editTodoDraft.title}
                                    onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Todo title"
                                    className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none"
                                  />
                                  <textarea
                                    value={editTodoDraft.description}
                                    onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Description (optional)"
                                    rows={2}
                                    className="w-full rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none resize-y"
                                  />
                                  <div className="flex gap-2">
                                    <select
                                      value={editTodoDraft.priority}
                                      onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, priority: event.target.value }))}
                                      className="flex-1 rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none"
                                    >
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                    </select>
                                    <input
                                      type="date"
                                      value={editTodoDraft.dueDate}
                                      onChange={(event) => setEditTodoDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                                      className="flex-1 rounded-lg border border-current/30 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-xs focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={cancelEditTodo}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-current/40 text-[11px] font-semibold"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditTodo(todo._id)}
                                      disabled={savingTodoId === todo._id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-semibold disabled:opacity-60"
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                      {savingTodoId === todo._id ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={todo.completed}
                                      onChange={() => handleToggleTodo(todo._id)}
                                      disabled={savingTodoId === todo._id}
                                      className="mt-1 cursor-pointer disabled:opacity-60"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className={`font-semibold text-sm ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                                        {todo.title}
                                      </h4>
                                      {todo.description && (
                                        <p className="text-xs text-secondary dark:text-gray-400 mt-1">{todo.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColor}`}>
                                          {todo.priority}
                                        </span>
                                        {todo.dueDate && (
                                          <span className="text-[10px] text-secondary dark:text-gray-400">
                                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => startEditTodo(todo)}
                                        className="inline-flex items-center justify-center h-6 w-6 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                        aria-label="Edit todo"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTodo(todo._id)}
                                        disabled={deletingTodoId === todo._id}
                                        className="inline-flex items-center justify-center h-6 w-6 rounded-lg hover:bg-red-500/15 transition-colors disabled:opacity-60"
                                        aria-label="Delete todo"
                                      >
                                        <Trash2 className="h-3 w-3" />
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
                  </CardContent>
                </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : requests.length === 0 ? (
              <p className="text-secondary dark:text-gray-400">Your recent activity and recommendations will appear here.</p>
            ) : (
              <div className="space-y-4">
                {normalizeRequests(requests).slice(0, 5).map((request, index) => (
                  <div
                    key={request._id || `request-${index}`}
                    className="flex items-start gap-4 p-4 rounded-lg border border-secondary/20 dark:border-gray-700 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-primary dark:text-gray-100 truncate">
                          {request.room?.title || 'Room Inquiry'}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      {request.room?.location?.area && (
                        <div className="flex items-center text-sm text-secondary dark:text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          {request.room.location.area}
                        </div>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.responseMessage && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Owner: "{request.ownerResponse.responseMessage}"
                        </p>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.availableVisitingTimes && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Visiting times: {request.ownerResponse.availableVisitingTimes}
                        </p>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.preferredContactMethod && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Contact via: {request.ownerResponse.preferredContactMethod}
                        </p>
                      )}
                      <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
                {requests.length > 5 && (
                  <p className="text-sm text-secondary dark:text-gray-400 text-center pt-2">
                    And {requests.length - 5} more inquiry{requests.length - 5 > 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
