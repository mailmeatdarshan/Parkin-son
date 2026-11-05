import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { apiFetch } from '../../apiClient';
import Sidebar from '../Sidebar/Sidebar';
import WeekView from './WeekView';
import DayView from './DayView';
import MonthView from './MonthView';
import YearView from './YearView';
import ArrangeDrawer from './ArrangeDrawer';
import {
  getWeekDays,
  setHoursAndMinutes,
  formatTime24,
  isSameDay,
} from '../../utils/calendarLayout';
import { useCrypto } from '../../context/CryptoContext';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CalendarContainer = () => {
  const { isLocked, encryptData, decryptData } = useCrypto();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'day' | 'week' | 'month' | 'year'
  const [isArrangeOpen, setIsArrangeOpen] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [decryptedTitles, setDecryptedTitles] = useState({});
  const [loading, setLoading] = useState(false);

  // Decrypt titles whenever tasks or unscheduledTasks update
  useEffect(() => {
    if (isLocked || !decryptData) return;
    const allTasks = [...tasks, ...unscheduledTasks];
    let cancelled = false;

    const decryptAll = async () => {
      const updated = { ...decryptedTitles };
      let changed = false;

      for (const t of allTasks) {
        if (!t || !t._id) continue;
        if (!(t._id in updated)) {
          if (t.encryptedDescription) {
            try {
              updated[t._id] = await decryptData(t.encryptedDescription);
            } catch (err) {
              updated[t._id] = t.title || '⚠️ Decryption Failed';
            }
          } else {
            updated[t._id] = t.title || 'Untitled Task';
          }
          changed = true;
        }
      }

      if (changed && !cancelled) {
        setDecryptedTitles(updated);
      }
    };

    decryptAll();

    return () => {
      cancelled = true;
    };
  }, [tasks, unscheduledTasks, isLocked, decryptData]);

  // Compute tasks for the currently selected day (for the Arrange Drawer)
  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => {
      if (!t.startDate) return false;
      return isSameDay(new Date(t.startDate), selectedDate);
    });
  }, [tasks, selectedDate]);

  // Quick New Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    priority: 0,
    color: '#4772FA',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    durationMinutes: 60,
    isUnscheduled: false,
  });

  // Calculate current view's date range
  const viewRange = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (view === 'day') {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (view === 'week') {
      const days = getWeekDays(currentDate);
      const start = new Date(days[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(days[6]);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (view === 'month') {
      // Month view + margin
      const start = new Date(y, m - 1, 20);
      const end = new Date(y, m + 1, 15);
      return { start, end };
    } else {
      // Year view: full year
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }, [currentDate, view]);

  // Fetch scheduled calendar tasks
  const fetchCalendarTasks = useCallback(async () => {
    try {
      setLoading(true);
      const startIso = viewRange.start.toISOString();
      const endIso = viewRange.end.toISOString();
      const res = await apiFetch(
        `/api/tasks/calendar?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching calendar tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [viewRange]);

  // Fetch unscheduled backlog tasks
  const fetchUnscheduledTasks = useCallback(async () => {
    try {
      const res = await apiFetch('/api/tasks/unscheduled');
      if (res.ok) {
        const data = await res.json();
        setUnscheduledTasks(data);
      }
    } catch (err) {
      console.error('Error fetching unscheduled tasks:', err);
    }
  }, []);

  // Fetch on range/view changes
  useEffect(() => {
    fetchCalendarTasks();
  }, [fetchCalendarTasks]);

  useEffect(() => {
    fetchUnscheduledTasks();
  }, [fetchUnscheduledTasks]);

  // Navigation handlers
  const handleNavigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + direction * 7);
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else {
      newDate.setFullYear(currentDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Optimistic Move / Schedule Task (from drag & drop)
  const handleTaskMove = async (taskId, newStartDate, newDueDate) => {
    // Prevent moving completed tasks
    const existingTask =
      tasks.find((t) => t._id === taskId) ||
      unscheduledTasks.find((t) => t._id === taskId);
    if (existingTask && existingTask.status) {
      return;
    }

    const prevTasks = [...tasks];
    const prevUnscheduled = [...unscheduledTasks];

    // Check if task was in unscheduled backlog
    const unscheduledIdx = unscheduledTasks.findIndex((t) => t._id === taskId);
    let taskToMove = null;

    if (unscheduledIdx !== -1) {
      taskToMove = {
        ...unscheduledTasks[unscheduledIdx],
        startDate: newStartDate.toISOString(),
        dueDate: newDueDate.toISOString(),
      };
      setUnscheduledTasks((prev) => prev.filter((t) => t._id !== taskId));
      setTasks((prev) => [...prev.filter((t) => t._id !== taskId), taskToMove]);
    } else {
      // Moving an already scheduled task
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? {
                ...t,
                startDate: newStartDate.toISOString(),
                dueDate: newDueDate.toISOString(),
              }
            : t
        )
      );
    }

    try {
      const res = await apiFetch(`/api/tasks/${taskId}/timeblock`, {
        method: 'PATCH',
        body: JSON.stringify({
          startDate: newStartDate.toISOString(),
          dueDate: newDueDate.toISOString(),
          isAllDay: false,
        }),
      });

      if (!res.ok) {
        // Rollback on failure
        setTasks(prevTasks);
        setUnscheduledTasks(prevUnscheduled);
      }
    } catch (err) {
      console.error('Failed to move task:', err);
      setTasks(prevTasks);
      setUnscheduledTasks(prevUnscheduled);
    }
  };

  // Optimistic Resize Task
  const handleTaskResize = async (task, newDurationMinutes) => {
    if (task.status) return;

    const prevTasks = [...tasks];
    const start = new Date(task.startDate);
    const newDueDate = new Date(start.getTime() + newDurationMinutes * 60000);

    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id
          ? { ...t, dueDate: newDueDate.toISOString() }
          : t
      )
    );

    try {
      const res = await apiFetch(`/api/tasks/${task._id}/timeblock`, {
        method: 'PATCH',
        body: JSON.stringify({
          dueDate: newDueDate.toISOString(),
        }),
      });

      if (!res.ok) {
        setTasks(prevTasks);
      }
    } catch (err) {
      console.error('Failed to resize task:', err);
      setTasks(prevTasks);
    }
  };

  // Optimistic Task Completion Toggle
  const handleTaskToggle = async (task) => {
    const nextStatus = !task.status;
    const isScheduled = Boolean(task.startDate);

    if (isScheduled) {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
      );
    } else {
      setUnscheduledTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
      );
    }

    try {
      await apiFetch(`/api/task/patchtask/${task._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.error('Failed to toggle task:', err);
      fetchCalendarTasks();
      fetchUnscheduledTasks();
    }
  };

  // Optimistic Delete Task
  const handleTaskDelete = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setUnscheduledTasks((prev) => prev.filter((t) => t._id !== taskId));

    try {
      await apiFetch(`/api/task/deletetask/${taskId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchCalendarTasks();
      fetchUnscheduledTasks();
    }
  };

  // Optimistic Unschedule Task (Move to Backlog)
  const handleUnscheduleTask = async (taskId) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status) return;

    const prevTasks = [...tasks];
    const prevUnscheduled = [...unscheduledTasks];

    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setUnscheduledTasks((prev) => [{ ...task, startDate: null, dueDate: null }, ...prev]);

    try {
      const res = await apiFetch(`/api/tasks/${taskId}/timeblock`, {
        method: 'PATCH',
        body: JSON.stringify({
          startDate: null,
          dueDate: null,
          isAllDay: false,
        }),
      });

      if (!res.ok) {
        setTasks(prevTasks);
        setUnscheduledTasks(prevUnscheduled);
      }
    } catch (err) {
      console.error('Failed to unschedule task:', err);
      setTasks(prevTasks);
      setUnscheduledTasks(prevUnscheduled);
    }
  };

  // Create Task (scheduled or unscheduled)
  const handleCreateTask = async (taskData) => {
    try {
      let payload = { ...taskData };
      if (!isLocked && encryptData && taskData.title) {
        try {
          const enc = await encryptData(taskData.title);
          payload.encryptedDescription = enc;
          payload.encryptedAESKey = 'e2e_v2';
        } catch (encErr) {
          console.error('Encryption failed for new task:', encErr);
        }
      }

      const res = await apiFetch('/api/tasks/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        if (taskData.title) {
          setDecryptedTitles((prev) => ({
            ...prev,
            [created._id]: taskData.title,
          }));
        }
        if (created.startDate) {
          setTasks((prev) => [...prev, created]);
        } else {
          setUnscheduledTasks((prev) => [created, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Modal Submit handler
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) return;

    let startDate = null;
    let dueDate = null;

    if (!modalForm.isUnscheduled) {
      const [h, m] = modalForm.startTime.split(':').map(Number);
      const base = new Date(`${modalForm.date}T00:00:00`);
      startDate = new Date(base);
      startDate.setHours(h, m, 0, 0);
      dueDate = new Date(startDate.getTime() + modalForm.durationMinutes * 60000);
    }

    await handleCreateTask({
      title: modalForm.title.trim(),
      priority: Number(modalForm.priority),
      color: modalForm.color,
      startDate: startDate ? startDate.toISOString() : null,
      dueDate: dueDate ? dueDate.toISOString() : null,
      isAllDay: false,
    });

    setShowAddModal(false);
    setModalForm({
      title: '',
      priority: 0,
      color: '#4772FA',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      durationMinutes: 60,
      isUnscheduled: false,
    });
  };

  // Helper to open Add Task modal prefilled with appropriate date
  const handleOpenAddModal = (targetDate = null) => {
    const dateObj =
      targetDate ||
      selectedDate ||
      (view === 'year'
        ? new Date(currentDate.getFullYear(), new Date().getMonth(), new Date().getDate())
        : currentDate);

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');

    setModalForm({
      title: '',
      priority: 0,
      color: '#4772FA',
      date: `${yyyy}-${mm}-${dd}`,
      startTime: '09:00',
      durationMinutes: 60,
      isUnscheduled: false,
    });
    setShowAddModal(true);
  };

  // Format Header Title
  const headerTitle = useMemo(() => {
    const month = MONTH_NAMES[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    if (view === 'day') {
      return `${month} ${currentDate.getDate()}, ${year}`;
    }
    if (view === 'year') {
      return `${year}`;
    }
    return `${month} ${year}`;
  }, [currentDate, view]);

  return (
    <div className="h-screen w-full bg-[#1E1E1E] text-white flex flex-col font-sans overflow-hidden select-none relative">
      {/* Sidebar Navigation */}
      <Sidebar activePage="Calendar" />

      {/* Top Navigation Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between pl-[92px] md:pl-[100px] pr-6 pt-5 pb-4 shrink-0 bg-[#1E1E1E] border-b border-[#38383A] z-20 gap-3 md:gap-0">
        {/* Left: Navigation Controls & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <h1 className="text-[24px] md:text-[28px] font-bold tracking-tight text-white flex items-center gap-2">
            {headerTitle}
          </h1>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => handleNavigate(-1)}
              className="p-1.5 rounded-full hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-full bg-[#121212] border border-white/[0.08] text-[12px] font-bold text-[#EBEBF5] hover:text-white hover:bg-white/[0.05] transition-all shadow-sm"
            >
              Today
            </button>
            <button
              onClick={() => handleNavigate(1)}
              className="p-1.5 rounded-full hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right: View Switcher, Arrange Drawer Toggle, Add Button */}
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Segmented View Switcher: Day | Week | Month | Year */}
          <div className="flex bg-[#121212] rounded-full p-1 border border-white/[0.06] shadow-inner">
            <button
              onClick={() => setView('day')}
              className={`px-3 md:px-4 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                view === 'day'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 md:px-4 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                view === 'week'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 md:px-4 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                view === 'month'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-3 md:px-4 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                view === 'year'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Year
            </button>
          </div>

          {/* Arrange Tasks Toggle */}
          <button
            onClick={() => setIsArrangeOpen(!isArrangeOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              isArrangeOpen
                ? 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40 shadow-sm'
                : 'bg-[#121212] text-neutral-300 border-white/[0.08] hover:bg-white/[0.05]'
            }`}
            title="Toggle Arrange Tasks Drawer"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Arrange</span>
            {unscheduledTasks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0A84FF] text-white text-[10px] flex items-center justify-center font-bold">
                {unscheduledTasks.length}
              </span>
            )}
          </button>

          {/* Quick Add Button */}
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-tr from-[#0A84FF] to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-[12px] font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Calendar Grid + Arrange Drawer */}
      <div className="flex-1 flex min-h-0 pl-[92px] md:pl-[100px] relative overflow-hidden">
        {/* Dynamic Calendar View Body */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              tasks={tasks}
              decryptedTitles={decryptedTitles}
              onTaskMove={handleTaskMove}
              onTaskResize={handleTaskResize}
              onTaskToggle={handleTaskToggle}
              onTaskClick={(task) => console.log('Task clicked:', task)}
              onDaySelect={(dayDate) => {
                setCurrentDate(dayDate);
                setView('day');
              }}
            />
          )}

          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              tasks={tasks}
              decryptedTitles={decryptedTitles}
              onTaskMove={handleTaskMove}
              onTaskResize={handleTaskResize}
              onTaskToggle={handleTaskToggle}
              onTaskClick={(task) => console.log('Task clicked:', task)}
            />
          )}

          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              tasks={tasks}
              decryptedTitles={decryptedTitles}
              onTaskMove={handleTaskMove}
              onDayClick={(dayDate) => {
                setSelectedDate(dayDate);
                setIsArrangeOpen(true);
              }}
              onDayDoubleClick={(dayDate) => {
                setSelectedDate(dayDate);
                setCurrentDate(dayDate);
                setView('day');
              }}
              onTaskClick={(task) => console.log('Task clicked:', task)}
            />
          )}

          {view === 'year' && (
            <YearView
              currentDate={currentDate}
              selectedDate={selectedDate}
              tasks={tasks}
              onTaskMove={handleTaskMove}
              onSelectMonth={(monthIndex) => {
                setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
                setView('month');
              }}
              onDayClick={(dayDate) => {
                setSelectedDate(dayDate);
                setIsArrangeOpen(true);
              }}
              onDayDoubleClick={(dayDate) => {
                setSelectedDate(dayDate);
                setCurrentDate(dayDate);
                setView('day');
              }}
              onQuickAddTask={(targetDate) => {
                handleOpenAddModal(targetDate);
              }}
            />
          )}
        </div>

        {/* Collapsible Arrange Tasks Drawer */}
        <ArrangeDrawer
          isOpen={isArrangeOpen}
          onClose={() => setIsArrangeOpen(false)}
          unscheduledTasks={unscheduledTasks}
          selectedDate={selectedDate}
          selectedDayTasks={selectedDayTasks}
          decryptedTitles={decryptedTitles}
          onCreateTask={handleCreateTask}
          onToggleTask={handleTaskToggle}
          onDeleteTask={handleTaskDelete}
          onUnscheduleTask={handleUnscheduleTask}
        />
      </div>

      {/* Quick Add Task Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#242426] border border-white/[0.12] w-full max-w-[380px] rounded-2xl p-4 shadow-2xl animate-fade-in relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-[16px] font-bold">New Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-3.5 mt-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="Task title..."
                  className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-xl px-3 py-2 text-[14px] text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Priority Picker */}
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { p: 0, label: 'None', color: '#9CA3AF' },
                    { p: 1, label: 'Low', color: '#3B82F6' },
                    { p: 3, label: 'Med', color: '#F59E0B' },
                    { p: 5, label: 'High', color: '#EF4444' },
                  ].map((item) => (
                    <button
                      key={item.p}
                      type="button"
                      onClick={() => setModalForm({ ...modalForm, priority: item.p })}
                      className={`py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                        modalForm.priority === item.p
                          ? 'bg-white/10 shadow-sm'
                          : 'bg-transparent text-neutral-400 border-white/[0.06] hover:text-white'
                      }`}
                      style={{
                        borderColor:
                          modalForm.priority === item.p ? item.color : undefined,
                        color: modalForm.priority === item.p ? item.color : undefined,
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule vs Unscheduled Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#1A1A1C] border border-white/[0.06]">
                <span className="text-[13px] font-medium text-neutral-300">
                  Save to Backlog (Unscheduled)
                </span>
                <input
                  type="checkbox"
                  checked={modalForm.isUnscheduled}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, isUnscheduled: e.target.checked })
                  }
                  className="w-4 h-4 rounded cursor-pointer accent-[#0A84FF]"
                />
              </div>

              {/* Date & Time fields if scheduled */}
              {!modalForm.isUnscheduled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={modalForm.date}
                      onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                      className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[12px] text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      step="900"
                      value={modalForm.startTime}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, startTime: e.target.value })
                      }
                      className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[12px] text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08] mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-full bg-[#0A84FF] hover:bg-blue-500 text-white text-[13px] font-bold shadow-md transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarContainer;
