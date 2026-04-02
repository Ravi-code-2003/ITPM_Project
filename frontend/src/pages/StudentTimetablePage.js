import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const TIMETABLE_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_HEADER_TONES = {
  Sunday: 'bg-rose-100 text-rose-800',
  Monday: 'bg-sky-100 text-sky-800',
  Tuesday: 'bg-emerald-100 text-emerald-800',
  Wednesday: 'bg-amber-100 text-amber-800',
  Thursday: 'bg-pink-100 text-pink-800',
  Friday: 'bg-violet-100 text-violet-800',
  Saturday: 'bg-indigo-100 text-indigo-800',
};

const createEmptyTimetable = () => TIMETABLE_DAYS.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {});

const toTimetableByDay = (items = []) => {
  const grouped = createEmptyTimetable();
  items.forEach((item) => {
    if (!item?.day || !grouped[item.day]) return;
    grouped[item.day].push(item);
  });
  return grouped;
};

const StudentTimetablePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?._id || user?.id || null;

  const [timetableForm, setTimetableForm] = useState({
    moduleName: '',
    hours: '2',
    day: 'Monday',
  });
  const [timetableByDay, setTimetableByDay] = useState(createEmptyTimetable());

  useEffect(() => {
    if (!userId) {
      setTimetableByDay(createEmptyTimetable());
      return;
    }

    const loadTimetable = async () => {
      try {
        const response = await api.get('/student/timetable');
        const items = Array.isArray(response.data?.items) ? response.data.items : [];
        setTimetableByDay(toTimetableByDay(items));
      } catch {
        setTimetableByDay(createEmptyTimetable());
      }
    };

    loadTimetable();
  }, [userId]);

  const addTimetableSession = async () => {
    const moduleName = timetableForm.moduleName.trim();
    const hours = Number(timetableForm.hours);
    const day = timetableForm.day;

    if (!moduleName) {
      toast.error('Please enter a module name.');
      return;
    }

    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error('Please choose valid study hours.');
      return;
    }

    try {
      const response = await api.post('/student/timetable', {
        moduleName,
        plannedHours: hours,
        day,
      });

      const item = response.data?.item;
      if (!item) {
        throw new Error('No timetable item returned');
      }

      setTimetableByDay((prev) => ({
        ...prev,
        [day]: [item, ...(prev[day] || [])],
      }));

      setTimetableForm((prev) => ({ ...prev, moduleName: '' }));
      toast.success('Study session added to timetable.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add timetable item.';
      toast.error(message);
    }
  };

  const toggleTimetableCompleted = async (day, item) => {
    try {
      const response = await api.patch(`/student/timetable/${item._id}`, {
        completed: !item.completed,
      });

      const updated = response.data?.item;
      setTimetableByDay((prev) => ({
        ...prev,
        [day]: (prev[day] || []).map((entry) => (
          entry._id === item._id ? (updated || { ...entry, completed: !entry.completed }) : entry
        )),
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update timetable item.';
      toast.error(message);
    }
  };

  const removeTimetableItem = async (day, itemId) => {
    try {
      await api.delete(`/student/timetable/${itemId}`);
      setTimetableByDay((prev) => ({
        ...prev,
        [day]: (prev[day] || []).filter((item) => item._id !== itemId),
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete timetable item.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 sm:mb-7">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 dark:border-amber-800/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
              Study plan
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary dark:text-gray-100">
              Student Timetable
            </h1>
            <p className="mt-2 text-sm text-secondary dark:text-gray-400 max-w-xl leading-6">
              Plan your module-by-module study sessions and mark them complete after finishing.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto !bg-white dark:!bg-surface-dark !shadow-sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/student/study-tracker')}
          >
            Back to Study Tracker
          </Button>
        </div>

        <Card className="border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-dark shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Add Study Session</CardTitle>
            <p className="text-sm text-secondary dark:text-gray-400 mt-1">
              Add modules with planned daily study hours.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                value={timetableForm.moduleName}
                onChange={(e) => setTimetableForm((prev) => ({ ...prev, moduleName: e.target.value }))}
                placeholder="Module name (e.g., DSA)"
                className="md:col-span-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-background-dark/40 px-3 py-2 text-sm"
              />
              <select
                value={timetableForm.hours}
                onChange={(e) => setTimetableForm((prev) => ({ ...prev, hours: e.target.value }))}
                className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-background-dark/40 px-3 py-2 text-sm"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={String(h)}>{`${h} hour${h > 1 ? 's' : ''}`}</option>
                ))}
              </select>
              <select
                value={timetableForm.day}
                onChange={(e) => setTimetableForm((prev) => ({ ...prev, day: e.target.value }))}
                className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-background-dark/40 px-3 py-2 text-sm"
              >
                {TIMETABLE_DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              icon={<PlusCircle className="h-4 w-4" />}
              onClick={addTimetableSession}
              className="mb-5"
            >
              Add Session
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {TIMETABLE_DAYS.map((day) => {
                const items = timetableByDay[day] || [];
                return (
                  <div key={day} className="rounded-xl border border-amber-200 dark:border-amber-700 overflow-hidden bg-white dark:bg-background-dark/30">
                    <div className={`px-3 py-2 font-semibold ${DAY_HEADER_TONES[day] || 'bg-amber-100 text-amber-800'}`}>
                      {day}
                    </div>
                    <div className="p-3 space-y-2 min-h-[120px]">
                      {items.length === 0 ? (
                        <p className="text-sm text-secondary dark:text-gray-400 text-center py-5">No sessions scheduled</p>
                      ) : (
                        items.map((item) => (
                          <div key={item._id} className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-background-dark/40 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className={`text-sm font-semibold ${item.completed ? 'line-through text-secondary dark:text-gray-400' : 'text-primary dark:text-gray-100'}`}>
                                  {item.moduleName}
                                </p>
                                <p className="text-xs text-secondary dark:text-gray-400">Planned: {item.hours} hour{item.hours > 1 ? 's' : ''}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                    onClick={() => toggleTimetableCompleted(day, item)}
                                  className={`inline-flex items-center justify-center h-8 w-8 rounded-md border ${item.completed ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-amber-300 text-amber-700'} dark:bg-background-dark/40`}
                                  title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                    onClick={() => removeTimetableItem(day, item._id)}
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-red-300 bg-white text-red-600 dark:bg-background-dark/40"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentTimetablePage;
