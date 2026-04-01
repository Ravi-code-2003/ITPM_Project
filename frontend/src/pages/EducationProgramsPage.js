import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, Star, Plus, X, Send, Inbox, CheckCircle, XCircle, Trash2, MessageSquare, FileText, ExternalLink, Download, Youtube, HardDrive, FlaskConical, LayoutDashboard, CalendarDays, GraduationCap, Bell, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const MATERIAL_TYPES = [
  { value: 'lecture-notes', label: 'Lecture Notes' },
  { value: 'tutorial',      label: 'Tutorial' },
  { value: 'past-paper',    label: 'Past Paper' },
  { value: 'assignment',    label: 'Assignment' },
  { value: 'other',         label: 'Other' },
];

const STATUS_CFG = {
  pending:   { label: 'Pending',   Icon: Clock,         color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20',  border: 'border-yellow-200 dark:border-yellow-700' },
  fulfilled: { label: 'Fulfilled', Icon: CheckCircle,   color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',    border: 'border-green-200 dark:border-green-700'  },
  rejected:  { label: 'Rejected',  Icon: XCircle,       color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',        border: 'border-red-200 dark:border-red-700'      },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
};

const EMPTY_FORM = { title: '', description: '', course: '', materialType: 'lecture-notes' };

const EMPTY_MODULE = { module: '', date: '' };

const MAT_TYPES = [
  { value: 'all',       label: 'All' },
  { value: 'pdf',       label: 'PDF' },
  { value: 'tute',      label: 'Tutorial' },
  { value: 'pastpaper', label: 'Past Paper' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'drive',     label: 'Drive' },
];

const MAT_CFG = {
  pdf:       { label: 'PDF',       bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400',     Icon: FileText },
  tute:      { label: 'Tutorial',  bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400',   Icon: BookOpen },
  pastpaper: { label: 'Past Paper',bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-400',Icon: FileText },
  youtube:   { label: 'YouTube',   bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400',     Icon: Youtube },
  drive:     { label: 'Drive',     bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', Icon: HardDrive },
};

const STUDENT_NOTICE_STORAGE_KEY = 'student_material_notices';
const STUDENT_NOTICE_SEEN_AT_KEY = 'student_material_notices_seen_at';
const PINNED_MATERIALS_STORAGE_PREFIX = 'student_pinned_materials';

const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const getExamCountdown = (examDate, nowMs) => {
  if (!examDate) return { label: 'No date set', started: false };

  const examMs = new Date(examDate).getTime();
  if (!Number.isFinite(examMs)) return { label: 'Invalid date', started: false };

  if (nowMs < examMs) {
    return { label: `Starts in ${formatDuration(examMs - nowMs)}`, started: false };
  }

  return { label: `Started ${formatDuration(nowMs - examMs)} ago`, started: true };
};

const getTodayInputDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EducationProgramsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const userId = user?._id || user?.id || null;
  const [mode, setMode] = useState('normal');
  const isExamMode = mode === 'exam';

  // Exam setup modal
  const storageKey = userId ? `examModules_${userId}` : null;
  const [showExamSetup, setShowExamSetup] = useState(false);
  const [examModules, setExamModules]     = useState([{ ...EMPTY_MODULE }, { ...EMPTY_MODULE }]);
  const [examModules_saved, setExamModules_saved] = useState([]);
  const todayDate = getTodayInputDate();
  const [examNowMs, setExamNowMs] = useState(Date.now());
  const hasSavedExamModules = examModules_saved.some((r) => r.module?.trim() || r.date);

  useEffect(() => {
    if (!isExamMode) return;

    const intervalId = setInterval(() => {
      setExamNowMs(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isExamMode]);

  // Load exam data for the currently logged-in user only
  useEffect(() => {
    if (!storageKey) {
      setExamModules_saved([]);
      setShowExamSetup(false);
      setMode('normal');
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      const examData = stored ? JSON.parse(stored) : [];
      setExamModules_saved(Array.isArray(examData) ? examData : []);
    } catch {
      setExamModules_saved([]);
    }

    setShowExamSetup(false);
    setMode('normal');
  }, [storageKey]);

  const openExamSetup = () => {
    // Pre-fill with saved modules when editing; start fresh on first use
    setExamModules(
      hasSavedExamModules
        ? examModules_saved.map((r) => ({ ...r }))
        : [{ ...EMPTY_MODULE }, { ...EMPTY_MODULE }]
    );
    setShowExamSetup(true);
  };

  const handleAddModule = () => {
    setExamModules((prev) => [...prev, { ...EMPTY_MODULE }]);
  };

  const handleRemoveModule = (idx) => {
    if (examModules.length <= 1) return;
    setExamModules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleModuleChange = (idx, field, value) => {
    setExamModules((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleExamSubmit = (e) => {
    e.preventDefault();
    const filled = examModules.filter((r) => r.module.trim() || r.date);
    if (filled.length === 0) {
      toast.error('Please add at least one module');
      return;
    }

    const hasPastDate = filled.some((r) => r.date && r.date < todayDate);
    if (hasPastDate) {
      toast.error('Exam date cannot be in the past');
      return;
    }

    setExamModules_saved(filled);
    try {
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(filled));
      }
    } catch {}
    setShowExamSetup(false);
    setMode('exam');
    toast.success('Exam mode activated!');
  };

  // Study materials from API
  const [materials, setMaterials]         = useState([]);
  const [loadingMat, setLoadingMat]       = useState(false);
  const [selectedMatType, setSelectedMatType] = useState('all');
  const [moduleSearch, setModuleSearch] = useState('');

  const fetchMaterials = useCallback(async () => {
    setLoadingMat(true);
    try {
      const res = await api.get('/education/materials/all');
      setMaterials(res.data.materials || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoadingMat(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const normalizedModuleSearch = moduleSearch.trim().toLowerCase();

  const filteredMaterials = (selectedMatType === 'all'
    ? materials
    : materials.filter(m => m.type === selectedMatType)
  ).filter(m => {
    const examModeMatch = isExamMode ? m.isImportant : true;
    const moduleName = (m.course || '').toLowerCase();
    const titleName = (m.title || '').toLowerCase();
    const searchMatch = !normalizedModuleSearch
      ? true
      : moduleName.includes(normalizedModuleSearch) || titleName.includes(normalizedModuleSearch);

    return examModeMatch && searchMatch;
  });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [notices, setNotices] = useState([]);
  const [showNotices, setShowNotices] = useState(false);
  const [noticesSeenAt, setNoticesSeenAt] = useState(0);
  const [pinnedMaterialIds, setPinnedMaterialIds] = useState([]);
  const pinnedStorageKey = userId ? `${PINNED_MATERIALS_STORAGE_PREFIX}_${userId}` : null;

  // My requests state
  const [requests, setRequests]   = useState([]);
  const [loadingReq, setLoadingReq] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!isStudent) return;
    setLoadingReq(true);
    try {
      const res = await api.get('/education/requests');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingReq(false);
    }
  }, [isStudent]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    if (!isStudent) {
      setNotices([]);
      setShowNotices(false);
      setNoticesSeenAt(0);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(STUDENT_NOTICE_STORAGE_KEY) || '[]');
      setNotices(Array.isArray(stored) ? stored : []);
      const seenAt = Number(localStorage.getItem(STUDENT_NOTICE_SEEN_AT_KEY) || '0');
      setNoticesSeenAt(Number.isFinite(seenAt) ? seenAt : 0);
    } catch {
      setNotices([]);
      setNoticesSeenAt(0);
    }
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent || !pinnedStorageKey) {
      setPinnedMaterialIds([]);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(pinnedStorageKey) || '[]');
      setPinnedMaterialIds(Array.isArray(stored) ? stored : []);
    } catch {
      setPinnedMaterialIds([]);
    }
  }, [isStudent, pinnedStorageKey]);

  const markNoticesAsSeen = () => {
    const seenAtNow = Date.now();
    setNoticesSeenAt(seenAtNow);
    localStorage.setItem(STUDENT_NOTICE_SEEN_AT_KEY, String(seenAtNow));
  };

  const unreadNoticeCount = notices.filter((notice) => {
    const createdAt = new Date(notice.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt > noticesSeenAt;
  }).length;

  const togglePinnedMaterial = (materialId) => {
    if (!isStudent || !pinnedStorageKey) return;

    setPinnedMaterialIds((prev) => {
      const next = prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId];

      localStorage.setItem(pinnedStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const pinnedMaterials = filteredMaterials.filter((mat) => pinnedMaterialIds.includes(mat._id));
  const otherMaterials = filteredMaterials.filter((mat) => !pinnedMaterialIds.includes(mat._id));
  const shouldScrollMaterials = otherMaterials.length > 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStudent) {
      toast.error('Only student accounts can request study materials.');
      setShowModal(false);
      return;
    }
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    setSubmitting(true);
    try {
      await api.post('/education/requests', form);
      toast.success('Request submitted!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await api.delete(`/education/requests/${id}`);
      toast.success('Request cancelled');
      setRequests((r) => r.filter((x) => x._id !== id));
    } catch {
      toast.error('Failed to cancel request');
    }
  };

  return (
    <>
    <div className={`min-h-screen py-8 ${isExamMode ? 'bg-gradient-to-b from-amber-50 via-white to-white dark:bg-red-900/20' : 'bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar — mode toggle + request button for students */}
        <div className="flex items-center justify-between mb-6">
          {/* Mode toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border shadow-sm ${isExamMode ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <button
              onClick={() => setMode('normal')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isExamMode
                  ? 'bg-primary text-white shadow-sm border border-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Normal Mode
            </button>
            <button
              onClick={() => isExamMode ? null : (hasSavedExamModules ? setMode('exam') : openExamSetup())}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isExamMode
                  ? 'bg-amber-50 dark:bg-amber-900/25 text-gray-900 dark:text-gray-100 shadow-sm border border-amber-300 dark:border-amber-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Exam Mode
            </button>
          </div>

          {/* Request button + notices — students only */}
          {isStudent && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotices((prev) => {
                      const nextValue = !prev;
                      if (nextValue) {
                        markNoticesAsSeen();
                      }
                      return nextValue;
                    });
                  }}
                  className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10 hover:bg-accent/20 text-primary dark:text-accent transition-colors"
                  title="Student notices"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNoticeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNoticeCount > 9 ? '9+' : unreadNoticeCount}
                    </span>
                  )}
                </button>

                {showNotices && (
                  <div className="absolute right-0 mt-2 w-[320px] max-w-[85vw] bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-primary dark:text-gray-100">Student Notices</p>
                      <button
                        onClick={() => setShowNotices(false)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-secondary dark:text-gray-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notices.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-secondary dark:text-gray-400">No notices yet.</p>
                      ) : (
                        notices.map((notice) => (
                          <button
                            key={notice.id}
                            type="button"
                            onClick={markNoticesAsSeen}
                            className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <p className="text-xs font-semibold text-primary dark:text-gray-100">{notice.title}</p>
                            <p className="text-xs text-secondary dark:text-gray-400 mt-1">{notice.message}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{new Date(notice.createdAt).toLocaleString()}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!isStudent) {
                    toast.error('Please sign in with a student account to request materials.');
                    return;
                  }
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-1.5 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Request Study Material
              </button>
            </div>
          )}
        </div>

        {/* ── Exam Schedule Banner (shown in exam mode) ────────────── */}
        {isExamMode && hasSavedExamModules && (
          <div className="mb-8 rounded-2xl border-2 border-red-400 dark:border-red-700 bg-white dark:bg-gray-800 p-6 sm:p-7 shadow-sm">
            {/* header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="bg-red-100 dark:bg-red-900/40 p-2.5 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Exam Schedule</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{examModules_saved.length} module{examModules_saved.length > 1 ? 's' : ''} scheduled</p>
                </div>
              </div>
              <button
                onClick={openExamSetup}
                className="text-sm text-gray-900 dark:text-gray-100 hover:underline font-medium whitespace-nowrap"
              >
                Edit schedule
              </button>
            </div>
            {/* module cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {examModules_saved.filter(r => r.module.trim()).map((r, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-red-400 dark:border-red-700 rounded-xl px-5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Module {i + 1}</span>
                  </div>
                  <p className="font-semibold text-primary dark:text-gray-100 text-base leading-snug">{r.module}</p>
                  {r.date ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-800 dark:text-gray-200 font-medium">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">No date set</span>
                  )}

                  {(() => {
                    const countdown = getExamCountdown(r.date, examNowMs);
                    return (
                      <span className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        countdown.started
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {countdown.label}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {isStudent && (
          <div className={`mb-8 rounded-2xl border p-5 sm:p-6 ${
            isExamMode
              ? 'border-red-300 dark:border-red-700 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/10'
              : 'border-accent/30 dark:border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/5'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wide ${isExamMode ? 'text-red-700 dark:text-red-300' : 'text-primary dark:text-accent'}`}>
                  {isExamMode ? 'Exam focus support' : 'Study productivity'}
                </p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">Track your focused study time</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {isExamMode
                    ? 'Keep timing your sessions in exam mode to stay consistent and review weekly progress.'
                    : 'Start, pause, resume study sessions and analyze your weekly progress with detailed reports.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/student/study-tracker')}
                className="inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors bg-red-600 hover:bg-red-700"
              >
                <Timer className="h-4 w-4" />
                {isExamMode ? 'Study Tracker' : 'Study Tracker'}
              </button>
            </div>
          </div>
        )}

        {/* ── Study Materials ────────────────────────────────────────────── */}
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-primary dark:text-gray-100'}`}>
                {isExamMode ? 'Important Study Materials' : 'Study Materials'}
                {isExamMode && (
                  <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-gray-100 bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 rounded-full align-middle border border-red-200 dark:border-red-700">
                    Exam Mode
                  </span>
                )}
              </h2>
              <p className={`text-sm mt-1 ${isExamMode ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                {isExamMode
                  ? 'Only materials marked as important by your education provider are shown'
                  : 'Resources uploaded by education providers'}
              </p>
            </div>

            <div className="w-full sm:w-80 sm:ml-auto">
              <input
                type="text"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Search by module name..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
              />
            </div>
          </div>

          <div className={`rounded-2xl p-4 border ${isExamMode ? 'bg-white/90 dark:bg-gray-900/40 border-red-200 dark:border-red-800' : 'bg-gray-50/80 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'}`}>
            {/* type filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {MAT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedMatType(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedMatType === value
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : `${isExamMode ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-red-200 dark:border-red-700 hover:border-red-400' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-accent/60'}`
                  }`}
                >
                  {label}
                  {value !== 'all' && (
                    <span className="ml-1 opacity-70">({materials.filter(m => m.type === value).length})</span>
                  )}
                </button>
              ))}
            </div>

            {loadingMat ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                {isExamMode ? (
                  <>
                    <Star className="h-12 w-12 text-yellow-300 dark:text-yellow-700 mx-auto mb-3" />
                    <p className="text-gray-900 dark:text-gray-100 font-medium">No important materials yet</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Your education provider hasn't marked any materials as important.</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-secondary dark:text-gray-400">
                      {normalizedModuleSearch
                        ? 'No study materials match that module name.'
                        : (selectedMatType === 'all' ? 'No study materials uploaded yet.' : `No ${MAT_TYPES.find(t=>t.value===selectedMatType)?.label} materials yet.`)}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {isStudent && pinnedMaterials.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <p className="text-sm font-bold text-primary dark:text-gray-100">Pinned Materials</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {pinnedMaterials.map((mat) => {
                        const cfg = MAT_CFG[mat.type] || MAT_CFG.pdf;
                        const { Icon } = cfg;
                        const isLink = mat.type === 'youtube' || mat.type === 'drive';
                        const isPinned = pinnedMaterialIds.includes(mat._id);
                        return (
                          <Card
                            key={mat._id}
                            className="h-full bg-white dark:bg-[#1E2233] border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <CardContent className="h-full p-5 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                                    <Icon className={`h-4 w-4 ${cfg.text}`} />
                                  </div>
                                  <p className="font-bold text-base text-primary dark:text-accent leading-snug line-clamp-2">{mat.title}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => togglePinnedMaterial(mat._id)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                      isPinned
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                    }`}
                                    title={isPinned ? 'Unpin material' : 'Pin material'}
                                  >
                                    <Star className={`h-2.5 w-2.5 ${isPinned ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                    {isPinned ? 'Pinned' : 'Pin'}
                                  </button>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                    {cfg.label}
                                  </span>
                                </div>
                              </div>
                              {mat.description && (
                                <p className={`text-xs line-clamp-2 ${isExamMode ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{mat.description}</p>
                              )}
                              {(mat.uploadedBy?.organizationName || mat.uploadedBy?.fullName) && (
                                <p className={`text-[11px] ${isExamMode ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>By {mat.uploadedBy.organizationName || mat.uploadedBy.fullName}</p>
                              )}
                              {mat.course && (
                                <span className="inline-flex w-fit items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 dark:bg-accent/5 text-accent">
                                  <BookOpen className="h-3 w-3" />{mat.course}
                                </span>
                              )}
                              {mat.fileSize && (
                                <p className={`text-[11px] ${isExamMode ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {(mat.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              )}
                              <div className="mt-auto pt-1">
                                {isLink ? (
                                  <a
                                    href={mat.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg font-semibold text-sm transition-colors bg-primary hover:bg-primary-hover text-white"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open {cfg.label}
                                  </a>
                                ) : (
                                  <a
                                    href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${mat.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg font-semibold text-sm transition-colors bg-primary hover:bg-primary-hover text-white"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </a>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={shouldScrollMaterials ? 'max-h-[560px] overflow-y-auto pr-1' : ''}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {otherMaterials.map((mat) => {
                    const cfg = MAT_CFG[mat.type] || MAT_CFG.pdf;
                    const { Icon } = cfg;
                    const isLink = mat.type === 'youtube' || mat.type === 'drive';
                    const isPinned = pinnedMaterialIds.includes(mat._id);
                    return (
                      <Card
                        key={mat._id}
                        className="h-full bg-white dark:bg-[#1E2233] border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <CardContent className="h-full p-5 flex flex-col gap-3">
                    {/* top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                          <Icon className={`h-4 w-4 ${cfg.text}`} />
                        </div>
                        <p className="font-bold text-base text-primary dark:text-accent leading-snug line-clamp-2">{mat.title}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {isStudent && (
                          <button
                            type="button"
                            onClick={() => togglePinnedMaterial(mat._id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                              isPinned
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            }`}
                            title={isPinned ? 'Unpin material' : 'Pin material'}
                          >
                            <Star className={`h-2.5 w-2.5 ${isPinned ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                            {isPinned ? 'Pinned' : 'Pin'}
                          </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {mat.isImportant && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" /> Important
                          </span>
                        )}
                      </div>
                    </div>

                    {/* description */}
                    {mat.description && (
                      <p className={`text-xs line-clamp-2 ${isExamMode ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{mat.description}</p>
                    )}

                    {/* provider name */}
                    {(mat.uploadedBy?.organizationName || mat.uploadedBy?.fullName) && (
                      <p className={`text-[11px] ${isExamMode ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>By {mat.uploadedBy.organizationName || mat.uploadedBy.fullName}</p>
                    )}

                    {/* course tag */}
                    {mat.course && (
                      <span className="inline-flex w-fit items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 dark:bg-accent/5 text-accent">
                        <BookOpen className="h-3 w-3" />{mat.course}
                      </span>
                    )}

                    {/* file info */}
                    {mat.fileSize && (
                      <p className={`text-[11px] ${isExamMode ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {(mat.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}

                    {/* action button */}
                    <div className="mt-auto pt-1">
                      {isLink ? (
                        <a
                          href={mat.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg font-semibold text-sm transition-colors bg-primary hover:bg-primary-hover text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open {cfg.label}
                        </a>
                      ) : (
                        <a
                          href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${mat.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg font-semibold text-sm transition-colors bg-primary hover:bg-primary-hover text-white"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      )}
                    </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              </>
            )}
          </div>
        </div>

        {/* ── My Study Material Requests (students only) ─────────────── */}
        {isStudent && (
          <Card className={`mt-12 ${isExamMode ? 'border-red-200 dark:border-red-700' : ''}`}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Inbox className="h-5 w-5 text-accent" />
                  <CardTitle className={isExamMode ? 'text-gray-900 dark:text-gray-100' : ''}>My Study Material Requests</CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700 text-xs font-medium rounded-full">
                    <Clock className="h-3 w-3" />
                    {requests.filter(r => r.status === 'pending').length} Pending
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 text-xs font-medium rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    {requests.filter(r => r.status === 'fulfilled').length} Fulfilled
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReq ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className={`text-sm ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>
                    No requests yet. Click <strong>Request Study Material</strong> above to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>Title</th>
                        <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>Type</th>
                        <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>Course</th>
                        <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>Status</th>
                        <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>Date</th>
                        <th className="py-3 px-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {requests.map((req) => (
                        <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-primary dark:text-gray-100 line-clamp-1">{req.title}</p>
                            {req.description && (
                              <p className={`text-xs mt-0.5 line-clamp-1 ${isExamMode ? 'text-gray-800 dark:text-gray-200' : 'text-secondary dark:text-gray-500'}`}>{req.description}</p>
                            )}
                          </td>
                          <td className={`py-3.5 px-4 whitespace-nowrap ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>
                            {MATERIAL_TYPES.find(t => t.value === req.materialType)?.label || req.materialType}
                          </td>
                          <td className={`py-3.5 px-4 ${isExamMode ? 'text-gray-900 dark:text-gray-100' : 'text-secondary dark:text-gray-400'}`}>
                            {req.course || <span className="text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={req.status} />
                              {req.adminNote && (
                                <span className={`flex items-center gap-1 text-xs ${isExamMode ? 'text-gray-800 dark:text-gray-200' : 'text-secondary dark:text-gray-400'}`}>
                                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                  <span className="line-clamp-1">{req.adminNote}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`py-3.5 px-4 whitespace-nowrap text-xs ${isExamMode ? 'text-gray-800 dark:text-gray-200' : 'text-secondary dark:text-gray-500'}`}>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            {req.status === 'pending' && (
                              <button
                                onClick={() => handleDelete(req._id)}
                                title="Cancel request"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>

    {/* ── Request Study Material Modal ──────────────────────────────── */}
    {showModal && isStudent && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(EMPTY_FORM); } }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[92vh] overflow-y-auto">
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                <Send className="h-5 w-5 text-primary dark:text-accent" />
              </div>
              <h2 className="text-lg font-bold text-primary dark:text-gray-100">Request Study Material</h2>
            </div>
            <button
              onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-secondary dark:text-gray-400" />
            </button>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1.5">Material Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MATERIAL_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, materialType: value }))}
                    className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.materialType === value
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent'
                        : 'border-gray-200 dark:border-gray-600 text-secondary dark:text-gray-400 hover:border-primary/40 hover:text-primary dark:hover:text-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                What do you need? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Database Systems – Week 4 Lecture Notes"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                Course <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.course}
                onChange={(e) => setForm(f => ({ ...f, course: e.target.value }))}
                placeholder="e.g. CS301 – Database Systems"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                Additional Details <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Any specific topics, chapters, or notes for the provider…"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-secondary dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-60 transition"
              >
                {submitting
                  ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  : <Send className="h-4 w-4" />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── Exam Setup Modal ──────────────────────────────────────────────── */}
    {showExamSetup && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) setShowExamSetup(false); }}
      >
        <div className="bg-rose-50 dark:bg-red-900/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-red-200 dark:border-red-800">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-red-200 dark:border-red-800 sticky top-0 bg-rose-50 dark:bg-red-900/20 z-10 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
                <FlaskConical className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary dark:text-gray-100">Enter Exam Mode</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add your upcoming exam modules &amp; dates</p>
              </div>
            </div>
            <button
              onClick={() => setShowExamSetup(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-secondary dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleExamSubmit} className="px-6 py-5 space-y-4">
            {/* Module rows */}
            <div className="space-y-3">
              {examModules.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      Module {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      disabled={examModules.length <= 1}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Module Name</label>
                      <input
                        type="text"
                        value={row.module}
                        onChange={(e) => handleModuleChange(idx, 'module', e.target.value)}
                        placeholder={`e.g. Data Structures`}
                        className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-red-950/20 text-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-300/60 focus:border-red-400 transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Exam Date</label>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleModuleChange(idx, 'date', e.target.value)}
                        min={todayDate}
                        className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-red-950/20 text-primary dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-300/60 focus:border-red-400 transition text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add module button */}
            <button
              type="button"
              onClick={handleAddModule}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-red-300 dark:border-red-700 text-gray-900 dark:text-gray-100 text-sm font-semibold hover:border-red-400 hover:bg-red-100/60 dark:hover:bg-red-900/20 transition w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              Add Module
            </button>

            {/* Info note */}
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              In Exam Mode, only materials marked as{' '}
              <strong className="text-yellow-600 dark:text-yellow-400">Important</strong>{' '}
              by your provider will be shown.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowExamSetup(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-secondary dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition text-sm"
              >
                <FlaskConical className="h-4 w-4" />
                Start Exam Mode
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
};

export default EducationProgramsPage;