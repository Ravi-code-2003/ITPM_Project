import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  GraduationCap,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Save,
  StickyNote,
  Wallet,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import FloatingStudentChatbot from '../../components/student/FloatingStudentChatbot';
import { stickyNotesService } from '../../services/stickyNotesService';
import { todoService } from '../../services/todoService';

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
  const navigate = useNavigate();
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
        const [notesResponse, todosResponse] = await Promise.all([
          stickyNotesService.getNotes(),
          todoService.getTodos(),
        ]);

        setNotes(normalizeNotes(notesResponse.notes));
        setTodos(Array.isArray(todosResponse.todos) ? todosResponse.todos : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data. Please refresh.');
      }

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

  const filteredNotes = notes.filter((note) => {
    const title = (note?.title || '').toLowerCase();
    return title.includes(noteSearch.trim().toLowerCase());
  });

  const handleTopToolClick = (tool) => {
    if (tool === 'finance') {
      navigate('/student/financial-support');
      return;
    }

    if (tool === 'study-tracker') {
      navigate('/student/study-tracker');
      return;
    }

    if (tool === 'timetable') {
      navigate('/student/timetable');
      return;
    }

    if (tool === 'education') {
      navigate('/education-programs');
      return;
    }

    if (tool === 'todo') {
      const todoSection = document.getElementById('todo-list-section');
      if (todoSection) {
        todoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tool === 'lost-found') {
      navigate('/student/lost-found');
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

  const completedTodosCount = todos.filter((todo) => todo.completed).length;
  const pendingTodosCount = todos.length - completedTodosCount;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoonCount = todos.filter((todo) => {
    if (!todo?.dueDate || todo.completed) {
      return false;
    }

    const due = new Date(todo.dueDate);
    if (Number.isNaN(due.getTime())) {
      return false;
    }

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  const nextTodo = todos
    .filter((todo) => !todo.completed && todo.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const quickLaunchCards = [
    {
      key: 'study-tracker',
      title: 'Study Tracker',
      description: 'Start a focused session and track real study time.',
      icon: Clock3,
      classes: 'bg-rose-100 text-rose-800 dark:bg-rose-900/25 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    },
    {
      key: 'timetable',
      title: 'Timetable Planner',
      description: 'Shape weekly study blocks with a clear daily plan.',
      icon: CalendarDays,
      classes: 'bg-sky-100 text-sky-800 dark:bg-sky-900/25 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    },
    {
      key: 'education',
      title: 'Learning Hub',
      description: 'Open lecture notes, resources, and latest materials.',
      icon: GraduationCap,
      classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/25 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    },
    {
      key: 'lost-found',
      title: 'Campus Community',
      description: 'Report or recover lost items around campus quickly.',
      icon: Compass,
      classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 bg-white/90 dark:bg-surface-dark/90 shadow-xl overflow-hidden">
          <div className="p-5 sm:p-7 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_42%)]">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
                <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Organize your day, capture ideas, and keep momentum across study and campus life.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Sticky Notes</p>
                    <p className="mt-1 text-2xl font-extrabold text-primary dark:text-gray-100">{notes.length}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Todos Done</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{completedTodosCount}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Due in 3 Days</p>
                    <p className="mt-1 text-2xl font-extrabold text-rose-700 dark:text-rose-300">{dueSoonCount}</p>
                  </div>
                </div>
              </div>

              <div className="xl:w-[360px] rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-slate-900/40 p-4 sm:p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Today focus</p>
                {nextTodo ? (
                  <div className="mt-2 space-y-2">
                    <h3 className="font-semibold text-primary dark:text-gray-100 leading-snug">{nextTodo.title}</h3>
                    <p className="text-xs text-secondary dark:text-gray-400">
                      Due {new Date(nextTodo.dueDate).toLocaleDateString()} • Priority {nextTodo.priority}
                    </p>
                    {nextTodo.description && (
                      <p className="text-xs text-secondary dark:text-gray-300 line-clamp-2">{nextTodo.description}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-secondary dark:text-gray-400">No pending task with a due date. Great pace today.</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTopToolClick('todo')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border border-amber-300 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                    Open Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTopToolClick('finance')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border border-emerald-300 dark:border-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Finance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {quickLaunchCards.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTopToolClick(item.key)}
                className={`text-left rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.classes}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs mt-1.5 opacity-85 leading-5">{item.description}</p>
                  </div>
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleTopToolClick('finance')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border shadow-sm transition-all duration-200 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
          >
            <Wallet className="h-4 w-4" />
            Finance Support
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('sticky-notes')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border shadow-md transition-all duration-200 bg-amber-500 hover:bg-amber-600 text-white border-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500 dark:border-amber-500"
          >
            <StickyNote className="h-4 w-4" />
            Sticky Notes
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('todo')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border shadow-sm transition-all duration-200 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700"
          >
            <ListTodo className="h-4 w-4" />
            ToDo List
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('study-tracker')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border shadow-sm transition-all duration-200 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-700"
          >
            <Clock3 className="h-4 w-4" />
            Study Tracker
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('timetable')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border shadow-sm transition-all duration-200 bg-sky-100 hover:bg-sky-200 text-sky-800 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-200 border-sky-300 dark:border-sky-700"
          >
            <CalendarDays className="h-4 w-4" />
            Timetable
          </button>

          <button
            type="button"
            onClick={() => handleTopToolClick('lost-found')}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border shadow-sm transition-all duration-200 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700"
          >
            <Search className="h-4 w-4" />
            Lost &amp; Found
          </button>
        </div>

        <div className="mb-8 rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-surface-dark/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm font-semibold">Task pulse</p>
            </div>
            <p className="text-xs text-secondary dark:text-gray-400">{pendingTodosCount} pending · {completedTodosCount} completed</p>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${todos.length > 0 ? (completedTodosCount / todos.length) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-secondary dark:text-gray-400">
            Keep your momentum: update one pending task and one sticky note to stay in flow.
          </p>
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
                  className="lg:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold px-3 py-1.5 text-xs shadow-md transition-all duration-200 disabled:opacity-60"
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
                          className="lg:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold px-3 py-1.5 text-xs shadow-md transition-all duration-200 disabled:opacity-60"
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

      </div>
      <FloatingStudentChatbot />
    </div>
  );
};

export default StudentDashboard;
