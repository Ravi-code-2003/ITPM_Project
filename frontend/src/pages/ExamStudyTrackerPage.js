import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Pause,
  Play,
  Square,
  Timer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ACTIVE_SESSION_STORAGE_PREFIX = 'exam_study_tracker_active';
const MIN_CHART_SCALE_MS = 30 * 60 * 1000; // 30 minutes baseline for visible growth

const formatDuration = (ms) => {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const getDurationParts = (ms) => {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  return {
    seconds: totalSeconds % 60,
    minutes: totalMinutes % 60,
    hours: totalHours,
  };
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const toDayKey = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getLast7Days = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  return days;
};

const getActiveSessionStorageKey = (userId) => (
  userId ? `${ACTIVE_SESSION_STORAGE_PREFIX}_${userId}` : null
);

const getActiveElapsedMs = (activeSession, nowMs) => {
  if (!activeSession) return 0;
  if (!activeSession.isRunning) return activeSession.elapsedMs || 0;

  const lastResumedMs = new Date(activeSession.lastResumedAt).getTime();
  if (!Number.isFinite(lastResumedMs)) return activeSession.elapsedMs || 0;

  return (activeSession.elapsedMs || 0) + Math.max(0, nowMs - lastResumedMs);
};

const StatCard = ({ label, value, hint, icon: Icon, accentClass = 'text-amber-600' }) => (
  <div className="rounded-2xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-dark shadow-sm p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary dark:text-gray-400">{label}</p>
        <p className="mt-1.5 text-xl sm:text-2xl font-bold text-primary dark:text-gray-100 leading-none">{value}</p>
        {hint && <p className="mt-1.5 text-xs text-secondary dark:text-gray-400">{hint}</p>}
      </div>
      {Icon && (
        <div className={`shrink-0 rounded-2xl p-3 bg-amber-50 dark:bg-amber-900/20 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  </div>
);

const CircularStudyClock = ({ elapsedMs, isRunning }) => {
  const safeElapsed = Math.max(0, Number(elapsedMs) || 0);
  const totalSeconds = Math.floor(safeElapsed / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const secondProgress = (totalSeconds % 60) / 60;
  const minuteProgress = (totalMinutes % 60) / 60;
  const hourProgress = (totalHours % 12) / 12;

  const size = 220;
  const center = size / 2;
  const rings = [
    { r: 92, progress: secondProgress, stroke: 'stroke-amber-300', label: 'Sec' },
    { r: 76, progress: minuteProgress, stroke: 'stroke-amber-500', label: 'Min' },
    { r: 60, progress: hourProgress, stroke: 'stroke-amber-700', label: 'Hour' },
  ];

  return (
    <div className="w-full max-w-[240px] sm:max-w-[260px] mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
        <defs>
          <linearGradient id="clockGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        <circle cx={center} cy={center} r={98} className="fill-white/80 dark:fill-slate-900/65" />

        {rings.map((ring) => {
          const circumference = 2 * Math.PI * ring.r;
          const dashOffset = circumference * (1 - ring.progress);

          return (
            <g key={ring.label} transform={`rotate(-90 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={ring.r}
                className="fill-none stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="8"
              />
              <circle
                cx={center}
                cy={center}
                r={ring.r}
                className={`fill-none ${ring.stroke}`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </g>
          );
        })}

        <circle cx={center} cy={center} r={44} className="fill-[url(#clockGlow)] opacity-20" />
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="fill-slate-800 dark:fill-slate-100 text-[17px] font-bold"
        >
          {formatDuration(safeElapsed)}
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-300 text-[10px] font-semibold"
        >
          {isRunning ? 'Running' : 'Paused'}
        </text>
      </svg>

    </div>
  );
};

const ExamStudyTrackerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?._id || user?.id || null;
  const activeSessionStorageKey = getActiveSessionStorageKey(userId);

  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!activeSessionStorageKey || !userId) {
      setActiveSession(null);
      setSessions([]);
      return;
    }

    try {
      const raw = localStorage.getItem(activeSessionStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      setActiveSession(parsed.activeSession || null);
    } catch {
      setActiveSession(null);
    }

    const loadSessions = async () => {
      try {
        const response = await api.get('/student/study-tracker');
        setSessions(Array.isArray(response.data?.sessions) ? response.data.sessions : []);
      } catch {
        setSessions([]);
      }
    };

    loadSessions();
  }, [activeSessionStorageKey, userId]);

  useEffect(() => {
    if (!activeSessionStorageKey) return;

    localStorage.setItem(
      activeSessionStorageKey,
      JSON.stringify({ activeSession })
    );
  }, [activeSession, activeSessionStorageKey]);


  useEffect(() => {
    if (!activeSession?.isRunning) return undefined;

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeSession?.isRunning]);

  useEffect(() => {
    setNowMs(Date.now());
  }, [activeSession]);

  const liveElapsedMs = getActiveElapsedMs(activeSession, nowMs);
  const liveParts = getDurationParts(liveElapsedMs);
  const todayKey = toDayKey(new Date());
  const todaySessions = useMemo(
    () => sessions.filter((session) => toDayKey(session.endedAt || session.startedAt) === todayKey),
    [sessions, todayKey]
  );

  const startSession = () => {
    if (activeSession) {
      toast.error('A study session is already in progress.');
      return;
    }

    const nowIso = new Date().toISOString();
    setActiveSession({
      id: `study_${Date.now()}`,
      startedAt: nowIso,
      elapsedMs: 0,
      isRunning: true,
      lastResumedAt: nowIso,
      pauseCount: 0,
    });
    toast.success('Study timer started. Stay focused.');
  };

  const pauseSession = () => {
    if (!activeSession || !activeSession.isRunning) return;

    const now = Date.now();
    const resumedMs = new Date(activeSession.lastResumedAt).getTime();
    const extraMs = Number.isFinite(resumedMs) ? Math.max(0, now - resumedMs) : 0;

    setActiveSession((prev) => ({
      ...prev,
      elapsedMs: (prev.elapsedMs || 0) + extraMs,
      isRunning: false,
      lastResumedAt: null,
      pauseCount: (prev.pauseCount || 0) + 1,
    }));

    toast('Session paused. Resume when you are ready.');
  };

  const resumeSession = () => {
    if (!activeSession || activeSession.isRunning) return;

    setActiveSession((prev) => ({
      ...prev,
      isRunning: true,
      lastResumedAt: new Date().toISOString(),
    }));

    toast.success('Session resumed.');
  };

  const endSession = async () => {
    if (!activeSession) return;

    const endedAt = new Date().toISOString();
    const durationMs = getActiveElapsedMs(activeSession, Date.now());

    const completed = {
      id: activeSession.id,
      startedAt: activeSession.startedAt,
      endedAt,
      durationMs,
      pauseCount: activeSession.pauseCount || 0,
    };

    setActiveSession(null);

    try {
      const response = await api.post('/student/study-tracker', {
        startedAt: completed.startedAt,
        endedAt: completed.endedAt,
        durationMs: completed.durationMs,
        pauseCount: completed.pauseCount,
      });

      const savedSession = response.data?.session || completed;
      setSessions((prev) => [savedSession, ...prev]);
      toast.success(`Session saved (${formatDuration(durationMs)}).`);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Could not save session. Please try again.';
      toast.error(message);
    }
  };


  const weeklyAnalytics = useMemo(() => {
    const days = getLast7Days();
    const totalsByDay = {};

    days.forEach((day) => {
      totalsByDay[toDayKey(day)] = 0;
    });

    sessions.forEach((session) => {
      const dayKey = toDayKey(session.endedAt || session.startedAt);
      if (!dayKey || totalsByDay[dayKey] === undefined) return;
      totalsByDay[dayKey] += session.durationMs || 0;
    });

    if (activeSession) {
      const activeDayKey = toDayKey(new Date());
      if (activeDayKey && totalsByDay[activeDayKey] !== undefined) {
        totalsByDay[activeDayKey] += liveElapsedMs;
      }
    }

    const rows = days.map((day) => {
      const dayKey = toDayKey(day);
      return {
        dayLabel: day.toLocaleDateString(undefined, { weekday: 'short' }),
        dateLabel: day.toLocaleDateString(),
        totalMs: totalsByDay[dayKey] || 0,
      };
    });

    const weeklyTotalMs = rows.reduce((sum, row) => sum + row.totalMs, 0);
    const completedSessions = sessions.length;
    const maxDayMs = Math.max(...rows.map((row) => row.totalMs), 0);
    const chartScaleMs = Math.max(maxDayMs, MIN_CHART_SCALE_MS);
    const todayKey = toDayKey(new Date());
    const todayTotalMs = todayKey && totalsByDay[todayKey] !== undefined ? totalsByDay[todayKey] : 0;
    const todaySessionsCount = sessions.filter(
      (session) => toDayKey(session.endedAt || session.startedAt) === todayKey
    ).length;

    return {
      rows,
      weeklyTotalMs,
      averagePerDayMs: weeklyTotalMs / 7,
      completedSessions,
      maxDayMs,
      chartScaleMs,
      todayTotalMs,
      todaySessionsCount,
    };
  }, [activeSession, liveElapsedMs, sessions]);

  const trackerStatus = activeSession
    ? activeSession.isRunning
      ? 'Running'
      : 'Paused'
    : 'Idle';

  const trackerStatusTone = activeSession
    ? activeSession.isRunning
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700'
      : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700'
    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  const downloadWeeklyReport = () => {
    const createdAt = new Date();
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Summary ──────────────────────────────────────────────
    const summaryData = [
      ['Exam Study Tracker – Weekly Analysis Report'],
      ['Generated at', createdAt.toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total focused time (7 days)', formatDuration(weeklyAnalytics.weeklyTotalMs)],
      ['Average per day', formatDuration(weeklyAnalytics.averagePerDayMs)],
      ['Completed sessions', weeklyAnalytics.completedSessions],
      ['Today study time', formatDuration(weeklyAnalytics.todayTotalMs)],
      ['Today sessions count', weeklyAnalytics.todaySessionsCount],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // ── Sheet 2: Daily Totals ─────────────────────────────────────────
    const dailyHeader = [['Day', 'Date', 'Duration (hh:mm:ss)', 'Total Minutes']];
    const dailyRows = weeklyAnalytics.rows.map((row) => [
      row.dayLabel,
      row.dateLabel,
      formatDuration(row.totalMs),
      Math.floor(row.totalMs / 60000),
    ]);
    const wsDaily = XLSX.utils.aoa_to_sheet([...dailyHeader, ...dailyRows]);
    wsDaily['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Totals');

    // ── Sheet 3: Session Log ──────────────────────────────────────────
    const sessionHeader = [['#', 'Started At', 'Ended At', 'Duration (hh:mm:ss)', 'Duration (min)', 'Pauses']];
    const sessionRows = sessions.map((s, i) => [
      i + 1,
      formatDateTime(s.startedAt),
      formatDateTime(s.endedAt),
      formatDuration(s.durationMs),
      Math.floor((s.durationMs || 0) / 60000),
      s.pauseCount || 0,
    ]);
    const wsSessions = XLSX.utils.aoa_to_sheet(
      sessionRows.length > 0 ? [...sessionHeader, ...sessionRows] : [...sessionHeader, ['No sessions recorded yet.']]
    );
    wsSessions['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsSessions, 'Session Log');

    XLSX.writeFile(wb, `study-report-${toDayKey(createdAt)}.xlsx`);
    toast.success('Excel report downloaded.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 sm:mb-7">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 dark:border-amber-800/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 shadow-sm">
              <Timer className="h-3.5 w-3.5" />
              Study companion
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary dark:text-gray-100">
              Study Time Tracker
            </h1>
            <p className="mt-2 text-sm text-secondary dark:text-gray-400 max-w-xl leading-6">
              Track focused sessions, pause or resume anytime, and review clear weekly progress in a layout that works on mobile and desktop.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto !bg-amber-100 hover:!bg-amber-200 !text-amber-800 !border-amber-300 hover:!border-amber-400 dark:!bg-amber-900/40 dark:hover:!bg-amber-900/60 dark:!text-amber-200 dark:!border-amber-700"
              icon={<Calendar className="h-4 w-4" />}
              onClick={() => navigate('/student/timetable')}
            >
              Student Timetable
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto !bg-white dark:!bg-surface-dark !shadow-sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/education-programs')}
            >
              Back to Programs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-4 mb-6 sm:mb-7">
          <StatCard
            label="Today study"
            value={formatDuration(weeklyAnalytics.todayTotalMs)}
            hint={`${weeklyAnalytics.todaySessionsCount} session(s) today. Resets daily.`}
            icon={Square}
            accentClass="text-amber-800 dark:text-amber-200"
          />
          <StatCard
            label="Current focus"
            value={formatDuration(liveElapsedMs)}
            hint="Active or last running session"
            icon={Timer}
            accentClass="text-amber-600 dark:text-amber-300"
          />
          <StatCard
            label="This week"
            value={formatDuration(weeklyAnalytics.weeklyTotalMs)}
            hint="Total focused study time"
            icon={BarChart3}
            accentClass="text-amber-700 dark:text-amber-300"
          />
          <StatCard
            label="Sessions"
            value={weeklyAnalytics.completedSessions}
            hint="Completed study sessions"
            icon={Play}
            accentClass="text-amber-600 dark:text-amber-300"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6 sm:mb-8">
          <Card className="xl:col-span-2 border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-dark shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">Live session</p>
                  <CardTitle className="mt-1 text-xl">Current Session</CardTitle>
                </div>
                <span className={`inline-flex items-center justify-center w-fit rounded-full border px-3 py-1 text-xs font-semibold ${trackerStatusTone}`}>
                  {trackerStatus}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-900/20 dark:to-background-dark p-5 sm:p-8 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 mb-2">Focused time</p>
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
                      <CircularStudyClock elapsedMs={liveElapsedMs} isRunning={Boolean(activeSession?.isRunning)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 w-full sm:w-72">
                    <div className="pt-0.5 space-y-1 text-xs sm:text-sm text-secondary dark:text-gray-400">
                      <p>Started: {activeSession ? formatDateTime(activeSession.startedAt) : 'No session running'}</p>
                      <p>State: {trackerStatus}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-amber-300/80 dark:border-amber-700/40 bg-amber-100/60 dark:bg-amber-900/20 px-2 py-2 text-center">
                        <p className="text-[10px] text-amber-800 dark:text-amber-200 font-semibold uppercase tracking-[0.08em]">Hour</p>
                        <p className="text-sm font-bold text-primary dark:text-gray-100">{String(liveParts.hours).padStart(2, '0')}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/15 px-2 py-2 text-center">
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-[0.08em]">Min</p>
                        <p className="text-sm font-bold text-primary dark:text-gray-100">{String(liveParts.minutes).padStart(2, '0')}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/15 px-2 py-2 text-center">
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-[0.08em]">Sec</p>
                        <p className="text-sm font-bold text-primary dark:text-gray-100">{String(liveParts.seconds).padStart(2, '0')}</p>
                      </div>
                    </div>
                    {!activeSession && (
                      <Button
                        icon={<Play className="h-4 w-4" />}
                        onClick={startSession}
                        className="w-full shadow-md"
                      >
                        Start Session
                      </Button>
                    )}

                    {activeSession?.isRunning && (
                      <Button
                        variant="secondary"
                        icon={<Pause className="h-4 w-4" />}
                        onClick={pauseSession}
                        className="w-full"
                      >
                        Pause Session
                      </Button>
                    )}

                    {activeSession && !activeSession.isRunning && (
                      <Button
                        icon={<Play className="h-4 w-4" />}
                        onClick={resumeSession}
                        className="w-full"
                      >
                        Resume Session
                      </Button>
                    )}

                    {activeSession && (
                      <Button
                        variant="danger"
                        icon={<Square className="h-4 w-4" />}
                        onClick={endSession}
                        className="w-full"
                      >
                        End Session
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-dark shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                <CardTitle>This Week</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 font-semibold">Avg/day</p>
                  <p className="mt-2 text-lg font-bold text-primary dark:text-gray-100">{formatDuration(weeklyAnalytics.averagePerDayMs)}</p>
                </div>
                <div className="rounded-2xl bg-amber-100/70 dark:bg-amber-900/25 border border-amber-300/80 dark:border-amber-700/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200 font-semibold">Today</p>
                  <p className="mt-2 text-lg font-bold text-primary dark:text-gray-100">{formatDuration(weeklyAnalytics.todayTotalMs)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 dark:border-amber-700 p-4 bg-white dark:bg-background-dark/40">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary dark:text-gray-400 mb-3">
                  <span>Weekly trend</span>
                  <span>{formatDuration(weeklyAnalytics.weeklyTotalMs)}</span>
                </div>
                <div className="flex items-end gap-2 h-44">
                  {weeklyAnalytics.rows.map((row) => {
                    const height = Math.max(8, (row.totalMs / weeklyAnalytics.chartScaleMs) * 100);
                    const isToday = row.dateLabel === new Date().toLocaleDateString();
                    return (
                      <div key={`${row.dayLabel}_${row.dateLabel}`} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex-1 flex items-end">
                          <div className="w-full rounded-t-2xl bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 dark:from-amber-500 dark:via-amber-400 dark:to-amber-300 shadow-sm" style={{ height: `${height}%`, minHeight: 8 }} />
                        </div>
                        <div className={`text-center ${isToday ? 'text-amber-700 dark:text-amber-300' : 'text-secondary dark:text-gray-500'}`}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">{row.dayLabel}</p>
                          <p className="text-[10px] mt-0.5">{formatDuration(row.totalMs)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                fullWidth
                variant="outline"
                size="sm"
                icon={<Calendar className="h-4 w-4" />}
                onClick={downloadWeeklyReport}
                className="!bg-white dark:!bg-background-dark/40"
              >
                Generate Analysis Report
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-dark shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Daily Study Time</CardTitle>
              <p className="text-xs text-secondary dark:text-gray-400 mt-1">A quick look at this week (Sunday to Saturday).</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weeklyAnalytics.rows.map((row) => {
                  const width = Math.max(6, (row.totalMs / weeklyAnalytics.chartScaleMs) * 100);
                  const isToday = row.dateLabel === new Date().toLocaleDateString();
                  return (
                    <div key={`${row.dayLabel}_${row.dateLabel}`} className="rounded-xl border border-amber-200/80 dark:border-amber-700/60 bg-white dark:bg-background-dark/40 p-2.5 sm:p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-primary dark:text-gray-100">{row.dayLabel}</p>
                          <p className="text-[11px] text-secondary dark:text-gray-400">{row.dateLabel}</p>
                        </div>
                        <div className={`text-right ${isToday ? 'text-amber-700 dark:text-amber-300' : 'text-primary dark:text-gray-100'}`}>
                          <p className="text-xs font-bold">{formatDuration(row.totalMs)}</p>
                          <p className="text-[11px] text-secondary dark:text-gray-400">{weeklyAnalytics.maxDayMs > 0 ? `${Math.round((row.totalMs / weeklyAnalytics.maxDayMs) * 100)}% of best day` : 'No sessions yet'}</p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-900/35 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 transition-all duration-300"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-dark shadow-lg">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <p className="text-sm text-secondary dark:text-gray-400 mt-1">Today&apos;s completed sessions (resets daily).</p>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-white dark:bg-background-dark/30 p-6 text-center">
                  <p className="font-semibold text-primary dark:text-gray-100">No sessions completed today.</p>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">Start a session to add today&apos;s history here.</p>
                </div>
              ) : (
                <div className="max-h-[520px] overflow-y-scroll pr-1">
                  <div className="space-y-3">
                  {todaySessions.slice(0, 20).map((session) => (
                    <div key={session.id} className="rounded-2xl border border-amber-200/80 dark:border-amber-700/60 bg-white dark:bg-background-dark/40 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2 min-w-0">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary dark:text-gray-400">Started</p>
                            <p className="text-sm font-semibold text-primary dark:text-gray-100 break-words">{formatDateTime(session.startedAt)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary dark:text-gray-400">Ended</p>
                            <p className="text-sm font-semibold text-primary dark:text-gray-100 break-words">{formatDateTime(session.endedAt)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 sm:min-w-[160px]">
                          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/40 px-3 py-2 text-center sm:text-left">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300 font-semibold">Duration</p>
                            <p className="mt-1 text-sm font-bold text-primary dark:text-gray-100">{formatDuration(session.durationMs)}</p>
                          </div>
                          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/40 px-3 py-2 text-center sm:text-left">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300 font-semibold">Pauses</p>
                            <p className="mt-1 text-sm font-bold text-primary dark:text-gray-100">{session.pauseCount || 0}</p>
                          </div>
                          <div className="rounded-xl bg-amber-100/70 dark:bg-amber-900/30 border border-amber-300/80 dark:border-amber-700/50 px-3 py-2 text-center sm:text-left">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-amber-800 dark:text-amber-200 font-semibold">Status</p>
                            <p className="mt-1 text-sm font-bold text-primary dark:text-gray-100">Saved</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamStudyTrackerPage;
