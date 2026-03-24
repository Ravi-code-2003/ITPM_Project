import React, { useEffect, useMemo, useState } from 'react';
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

const STORAGE_PREFIX = 'exam_study_tracker';

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
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - i);
    days.push(day);
  }

  return days;
};

const getStorageKey = (userId) => (userId ? `${STORAGE_PREFIX}_${userId}` : null);

const getActiveElapsedMs = (activeSession, nowMs) => {
  if (!activeSession) return 0;
  if (!activeSession.isRunning) return activeSession.elapsedMs || 0;

  const lastResumedMs = new Date(activeSession.lastResumedAt).getTime();
  if (!Number.isFinite(lastResumedMs)) return activeSession.elapsedMs || 0;

  return (activeSession.elapsedMs || 0) + Math.max(0, nowMs - lastResumedMs);
};

const ExamStudyTrackerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?._id || user?.id || null;
  const storageKey = getStorageKey(userId);

  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!storageKey) {
      setActiveSession(null);
      setSessions([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      setActiveSession(parsed.activeSession || null);
      setSessions(Array.isArray(parsed.sessions) ? parsed.sessions : []);
    } catch {
      setActiveSession(null);
      setSessions([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;

    const payload = {
      activeSession,
      sessions,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [activeSession, sessions, storageKey]);

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

  const endSession = () => {
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

    const updatedSessions = [completed, ...sessions];

    setSessions(updatedSessions);
    setActiveSession(null);

    // Directly save to localStorage to ensure persistence
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          activeSession: null,
          sessions: updatedSessions,
        }));
        console.log('Session saved to localStorage:', completed);
      } catch (err) {
        console.error('Failed to save session:', err);
      }
    }

    toast.success(`Session saved (${formatDuration(durationMs)}).`);
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
    const longestSessionMs = sessions.reduce(
      (max, session) => Math.max(max, session.durationMs || 0),
      0
    );

    return {
      rows,
      weeklyTotalMs,
      averagePerDayMs: weeklyTotalMs / 7,
      completedSessions,
      longestSessionMs,
    };
  }, [activeSession, liveElapsedMs, sessions]);

  const downloadWeeklyReport = () => {
    const createdAt = new Date();
    const lines = [
      'Exam Study Tracker - Weekly Analysis Report',
      `Generated at: ${createdAt.toLocaleString()}`,
      '',
      `Total focused time (7 days): ${formatDuration(weeklyAnalytics.weeklyTotalMs)}`,
      `Average per day: ${formatDuration(weeklyAnalytics.averagePerDayMs)}`,
      `Completed sessions: ${weeklyAnalytics.completedSessions}`,
      `Longest session: ${formatDuration(weeklyAnalytics.longestSessionMs)}`,
      '',
      'Daily totals',
      '-----------',
      ...weeklyAnalytics.rows.map(
        (row) => `${row.dayLabel} (${row.dateLabel}): ${formatDuration(row.totalMs)}`
      ),
      '',
      'Recent sessions',
      '--------------',
      ...(sessions.slice(0, 10).length > 0
        ? sessions.slice(0, 10).map(
            (session) =>
              `${formatDateTime(session.startedAt)} -> ${formatDateTime(session.endedAt)} | ${formatDuration(session.durationMs)} | pauses: ${session.pauseCount || 0}`
          )
        : ['No completed sessions yet.']),
    ];

    const report = lines.join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `study-report-${toDayKey(createdAt)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
    toast.success('Weekly report generated.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Exam mode companion</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100 mt-1">Study Time Tracker</h1>
            <p className="text-sm text-secondary dark:text-gray-400 mt-1">Start, pause, resume and end your study sessions with a clear weekly analysis.</p>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/education-programs')}
          >
            Back to the Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <Card className="xl:col-span-2 border border-amber-200 dark:border-amber-700/60">
            <CardHeader className="mb-3">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                <CardTitle>Current Session</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-6 sm:p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-2">Focused time</p>
                <p className="text-4xl sm:text-5xl font-black text-primary dark:text-gray-100 tracking-wide">{formatDuration(liveElapsedMs)}</p>
                <div className="mt-3 text-xs sm:text-sm text-secondary dark:text-gray-400">
                  <p>Start time: {activeSession ? formatDateTime(activeSession.startedAt) : '-'}</p>
                  <p>Status: {activeSession ? (activeSession.isRunning ? 'Running' : 'Paused') : 'Idle'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                {!activeSession && (
                  <Button
                    icon={<Play className="h-4 w-4" />}
                    onClick={startSession}
                  >
                    Start Study Session
                  </Button>
                )}

                {activeSession?.isRunning && (
                  <Button
                    variant="secondary"
                    icon={<Pause className="h-4 w-4" />}
                    onClick={pauseSession}
                  >
                    Pause
                  </Button>
                )}

                {activeSession && !activeSession.isRunning && (
                  <Button
                    icon={<Play className="h-4 w-4" />}
                    onClick={resumeSession}
                  >
                    Resume
                  </Button>
                )}

                {activeSession && (
                  <Button
                    variant="danger"
                    icon={<Square className="h-4 w-4" />}
                    onClick={endSession}
                  >
                    End Session
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <CardTitle>This Week</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary dark:text-gray-400">Total study time</p>
                <p className="text-2xl font-bold text-primary dark:text-gray-100">{formatDuration(weeklyAnalytics.weeklyTotalMs)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary dark:text-gray-400">Avg per day</p>
                <p className="text-lg font-semibold text-primary dark:text-gray-100">{formatDuration(weeklyAnalytics.averagePerDayMs)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary dark:text-gray-400">Completed sessions</p>
                <p className="text-lg font-semibold text-primary dark:text-gray-100">{weeklyAnalytics.completedSessions}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary dark:text-gray-400">Longest session</p>
                <p className="text-lg font-semibold text-primary dark:text-gray-100">{formatDuration(weeklyAnalytics.longestSessionMs)}</p>
              </div>
              <Button
                fullWidth
                variant="outline"
                icon={<Calendar className="h-4 w-4" />}
                onClick={downloadWeeklyReport}
              >
                Generate Analysis Report
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Study Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">Day</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">Focused Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {weeklyAnalytics.rows.map((row) => (
                      <tr key={`${row.dayLabel}_${row.dateLabel}`}>
                        <td className="py-3 px-4 font-semibold text-primary dark:text-gray-100">{row.dayLabel}</td>
                        <td className="py-3 px-4 text-secondary dark:text-gray-400">{row.dateLabel}</td>
                        <td className="py-3 px-4 text-primary dark:text-gray-100">{formatDuration(row.totalMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">Start Time</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">End Time</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">Duration</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-gray-400">Pauses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-4 text-center text-secondary dark:text-gray-400">
                          No sessions completed yet.
                        </td>
                      </tr>
                    ) : (
                      sessions.slice(0, 20).map((session) => (
                        <tr key={session.id}>
                          <td className="py-3 px-4 text-primary dark:text-gray-100">{formatDateTime(session.startedAt)}</td>
                          <td className="py-3 px-4 text-primary dark:text-gray-100">{formatDateTime(session.endedAt)}</td>
                          <td className="py-3 px-4 font-semibold text-primary dark:text-gray-100">{formatDuration(session.durationMs)}</td>
                          <td className="py-3 px-4 text-secondary dark:text-gray-400">{session.pauseCount || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamStudyTrackerPage;
