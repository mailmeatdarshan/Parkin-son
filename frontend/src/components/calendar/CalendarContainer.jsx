import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  MoreHorizontal,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  CalendarPlus,
  Check,
  X,
  Clock,
  Sparkle,
} from '@phosphor-icons/react';
import { apiFetch } from '../../apiClient';
import Sidebar from '../Sidebar/Sidebar';
import WeekView from './WeekView';
import DayView from './DayView';
import MonthView from './MonthView';
import YearView from './YearView';
import LifeView from './LifeView';
import ArrangeDrawer from './ArrangeDrawer';
import {
  getWeekDays,
  setHoursAndMinutes,
  formatTime24,
  isSameDay,
} from '../../utils/calendarLayout';
import { useCrypto } from '../../context/CryptoContext';
import { useSettings } from '../../context/SettingsContext';

// Stopwatch Brutalist Heavy Card & Input Styles
const heavyCardStyle = {
  background: 'linear-gradient(180deg, #111111 0%, #000000 100%)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,1), 0 0 40px rgba(255,255,255,0.02)',
};

const heavyInputStyle = {
  background: '#070707',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: 'inset 0 2px 12px rgba(0,0,0,1), 0 1px 0px rgba(255,255,255,0.04)',
};

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
  const { calendarYearHeatmap } = useSettings();
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'month' : 'week'));
  const [isArrangeOpen, setIsArrangeOpen] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? false : true));
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const mobileOptionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileOptionsRef.current && !mobileOptionsRef.current.contains(e.target)) {
        setShowMobileOptions(false);
      }
    };
    if (showMobileOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileOptions]);

  const [tasks, setTasks] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [decryptedTitles, setDecryptedTitles] = useState({});
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);

  // Fetch heatmap data for Year View when enabled
  useEffect(() => {
    if (view !== 'year' || !calendarYearHeatmap) return;
    let isMounted = true;
    const fetchHeatmap = async () => {
      try {
        const res = await apiFetch('/api/dashboard/heatmap', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.heatmapData) {
            setHeatmapData(data.heatmapData);
          }
        }
      } catch (err) {
        console.error('Error fetching calendar year heatmap data:', err);
      }
    };
    fetchHeatmap();
    return () => { isMounted = false; };
  }, [view, calendarYearHeatmap]);

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
  const [popoverPos, setPopoverPos] = useState(null); // { x: number, y: number } | null
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

  // Helper to open Add Task modal prefilled with appropriate date, time, and cursor position
  const handleOpenAddModal = (targetDate = null, defaultStartTime = null, clickPos = null) => {
    const dateObj =
      targetDate ||
      selectedDate ||
      (view === 'year'
        ? new Date(currentDate.getFullYear(), new Date().getMonth(), new Date().getDate())
        : currentDate);

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');

    let initialTime = '09:00';
    if (defaultStartTime) {
      initialTime = defaultStartTime;
    } else if (targetDate instanceof Date && (targetDate.getHours() !== 0 || targetDate.getMinutes() !== 0)) {
      initialTime = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
    }

    setPopoverPos(clickPos || null);
    setModalForm({
      title: '',
      priority: 0,
      color: '#4772FA',
      date: `${yyyy}-${mm}-${dd}`,
      startTime: initialTime,
      durationMinutes: 60,
      isUnscheduled: false,
    });
    setShowAddModal(true);
  };

  // Close on Escape key
  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowAddModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  // Compute smart popover coordinates beside cursor
  const popoverCoords = useMemo(() => {
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobileScreen) {
      return {
        top: Math.max(60, (window.innerHeight - 340) / 2),
        left: Math.max(10, (window.innerWidth - 300) / 2),
      };
    }

    if (!popoverPos) {
      return {
        top: Math.max(80, window.innerHeight / 2 - 160),
        left: Math.max(20, window.innerWidth / 2 - 155),
      };
    }

    const POPOVER_WIDTH = 310;
    const POPOVER_HEIGHT = 310;

    let left = popoverPos.x + 14;
    let top = popoverPos.y - 25;

    // Flip to left of cursor if it overflows right edge
    if (left + POPOVER_WIDTH > window.innerWidth - 14) {
      left = popoverPos.x - POPOVER_WIDTH - 14;
    }
    if (left < 14) left = 14;

    // Clamp vertically
    if (top + POPOVER_HEIGHT > window.innerHeight - 14) {
      top = window.innerHeight - POPOVER_HEIGHT - 14;
    }
    if (top < 65) top = 65;

    return { top, left };
  }, [popoverPos]);

  // Format Header Title
  const headerTitle = useMemo(() => {
    if (view === 'life') {
      return 'Life Calendar';
    }
    const month = MONTH_NAMES[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    if (view === 'day') {
      return `${month} ${currentDate.getDate()}, ${year}`;
    }
    if (view === 'year') {
      return `${year}`;
    }
    if (view === 'week') {
      const weekDays = getWeekDays(currentDate);
      const start = weekDays[0];
      const end = weekDays[6];
      const startMonth = MONTH_NAMES[start.getMonth()].slice(0, 3);
      const endMonth = MONTH_NAMES[end.getMonth()].slice(0, 3);
      if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
      }
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
    }
    return `${month} ${year}`;
  }, [currentDate, view]);

  return (
    <div className="h-screen w-full bg-[#1E1E1E] text-white flex flex-col font-sans overflow-hidden select-none relative">
      {/* Sidebar Navigation */}
      <Sidebar activePage="Calendar" />

      {/* MOBILE TOOLBAR (Visible on small screens < 768px) */}
      <div className="md:hidden flex items-center justify-between px-3 pt-3 pb-2.5 shrink-0 bg-[#1A1A1C] border-b border-[#38383A] z-20 select-none">
        {/* Left: Space for floating sidebar toggle (w-11) + Grid button (toggles Month <-> Year) */}
        <div className="flex items-center gap-2 pl-12">
          <button
            onClick={() => setView(view === 'year' ? 'month' : 'year')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              view === 'year'
                ? 'bg-blue-500/20 text-[#0A84FF] border-blue-500/40 shadow-sm'
                : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:bg-white/[0.08]'
            }`}
            title={view === 'year' ? 'Switch to Month View' : 'Switch to Year View'}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        {/* Center: Dynamic title with Prev/Next Controls */}
        <div className="flex items-center gap-1">
          {view !== 'life' && (
            <button
              onClick={() => handleNavigate(-1)}
              className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <h1 className="text-[15px] font-bold tracking-tight text-white px-1 text-center truncate max-w-[150px]">
            {headerTitle}
          </h1>
          {view !== 'life' && (
            <button
              onClick={() => handleNavigate(1)}
              className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Right: Today Pill + ... Menu */}
        <div className="flex items-center gap-1.5" ref={mobileOptionsRef}>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-[11px] font-bold text-white hover:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
          >
            Today
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMobileOptions((prev) => !prev)}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                showMobileOptions
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-white/[0.04] text-neutral-400 hover:text-white border-white/[0.08]'
              }`}
              title="View Options"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMobileOptions && (
              <div className="absolute right-0 top-full mt-2 w-48 py-1.5 bg-[#1C1C1E] border border-white/[0.12] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Views
                </div>
                {[
                  { id: 'month', label: 'Month View' },
                  { id: 'year', label: 'Year View' },
                  { id: 'week', label: 'Week View' },
                  { id: 'day', label: 'Day View' },
                  { id: 'life', label: 'Life Calendar' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      setShowMobileOptions(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-[12px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      view === item.id
                        ? 'bg-blue-500/20 text-[#0A84FF]'
                        : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {view === item.id && <Check size={14} weight="bold" />}
                  </button>
                ))}

                <div className="my-1 border-t border-white/[0.08]" />

                <button
                  onClick={() => {
                    setIsArrangeOpen((prev) => !prev);
                    setShowMobileOptions(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[12px] font-semibold flex items-center justify-between text-neutral-300 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={13} />
                    Arrange Tasks
                  </span>
                  {unscheduledTasks.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#0A84FF] text-white text-[10px] flex items-center justify-center font-bold">
                      {unscheduledTasks.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP TOOLBAR (Hidden on mobile < 768px) */}
      <div className="hidden md:flex flex-row items-center justify-between pl-14 sm:pl-16 md:pl-[100px] pr-3 sm:pr-6 pt-3 sm:pt-4 md:pt-5 pb-3 md:pb-4 shrink-0 bg-[#1E1E1E] border-b border-[#38383A] z-20 gap-0">
        {/* Left: Navigation Controls & Title */}
        <div className="flex items-center justify-start gap-2 sm:gap-3 w-auto">
          <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
            {headerTitle}
          </h1>

          {view !== 'life' && (
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <button
                onClick={() => handleNavigate(-1)}
                className="p-1 rounded-full hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#121212] border border-white/[0.08] text-[11px] sm:text-[12px] font-bold text-[#EBEBF5] hover:text-white hover:bg-white/[0.05] transition-all shadow-sm cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => handleNavigate(1)}
                className="p-1 rounded-full hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right: View Switcher, Arrange Drawer Toggle, Add Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-auto justify-end overflow-x-auto no-scrollbar py-0.5">
          {/* Segmented View Switcher: Day | Week | Month | Year | Life */}
          <div className="flex bg-[#121212] rounded-full p-0.5 sm:p-1 border border-white/[0.06] shadow-inner shrink-0">
            <button
              onClick={() => setView('day')}
              className={`px-2.5 sm:px-3 md:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                view === 'day'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-2.5 sm:px-3 md:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                view === 'week'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-2.5 sm:px-3 md:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                view === 'month'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-2.5 sm:px-3 md:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                view === 'year'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setView('life')}
              className={`px-2.5 sm:px-3 md:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                view === 'life'
                  ? 'bg-[#3A3A3C] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Life
            </button>
          </div>

          {/* Arrange Tasks Toggle */}
          {view !== 'life' && (
            <button
              onClick={() => setIsArrangeOpen(!isArrangeOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold border transition-all shrink-0 cursor-pointer ${
                isArrangeOpen
                  ? 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40 shadow-sm'
                  : 'bg-[#121212] text-neutral-300 border-white/[0.08] hover:bg-white/[0.05]'
              }`}
              title="Toggle Arrange Tasks Drawer"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Arrange</span>
              {unscheduledTasks.length > 0 && (
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#0A84FF] text-white text-[9px] sm:text-[10px] flex items-center justify-center font-bold">
                  {unscheduledTasks.length}
                </span>
              )}
            </button>
          )}

          {/* Quick Add Button */}
          {view !== 'life' && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-tr from-[#0A84FF] to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-[11px] sm:text-[12px] font-bold transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace: Calendar Grid + Arrange Drawer */}
      <div className="flex-1 flex min-h-0 pl-0 md:pl-[100px] relative overflow-hidden">

        {/* Dynamic Calendar View Body */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              tasks={tasks}
              decryptedTitles={decryptedTitles}
              isMobile={isMobile}
              onTaskMove={handleTaskMove}
              onTaskResize={handleTaskResize}
              onTaskToggle={handleTaskToggle}
              onTaskClick={(task) => console.log('Task clicked:', task)}
              onDaySelect={(dayDate) => {
                setCurrentDate(dayDate);
                setView('day');
              }}
              onTimeSlotClick={(date, timeStr, clickPos) => handleOpenAddModal(date, timeStr, clickPos)}
            />
          )}

          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              tasks={tasks}
              decryptedTitles={decryptedTitles}
              isMobile={isMobile}
              onTaskMove={handleTaskMove}
              onTaskResize={handleTaskResize}
              onTaskToggle={handleTaskToggle}
              onTaskClick={(task) => console.log('Task clicked:', task)}
              onTimeSlotClick={(date, timeStr, clickPos) => handleOpenAddModal(date, timeStr, clickPos)}
            />
          )}

          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              tasks={tasks}
              decryptedTitles={decryptedTitles}
              isMobile={isMobile}
              onTaskMove={handleTaskMove}
              onDayClick={(dayDate) => {
                setSelectedDate(dayDate);
                if (!isMobile) {
                  setIsArrangeOpen(true);
                }
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
              heatmapEnabled={calendarYearHeatmap}
              heatmapData={heatmapData}
              isMobile={isMobile}
              onTaskMove={handleTaskMove}
              onSelectMonth={(monthIndex) => {
                setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
                setView('month');
              }}
              onDayClick={(dayDate) => {
                setSelectedDate(dayDate);
                if (isMobile) {
                  setCurrentDate(dayDate);
                  setView('month');
                } else {
                  setIsArrangeOpen(true);
                }
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

          {view === 'life' && (
            <LifeView isMobile={isMobile} />
          )}
        </div>

        {/* Collapsible Arrange Tasks Drawer (hidden in Life in Weeks view) */}
        {view !== 'life' && (
          <>
            {isArrangeOpen && (
              <div
                className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsArrangeOpen(false)}
              />
            )}
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
          </>
        )}
      </div>

      {/* Quick Add Task Popover - Styled in Stopwatch Brutalist Theme beside Cursor */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* Minimal Click-Outside Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setShowAddModal(false)}
            />

            {/* Floating Popover Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.65, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26, mass: 0.65 }}
              style={{
                ...heavyCardStyle,
                top: `${popoverCoords.top}px`,
                left: `${popoverCoords.left}px`,
              }}
              className="fixed z-50 w-[300px] sm:w-[315px] rounded-[22px] p-4 text-white shadow-2xl flex flex-col gap-3 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-500/15 border border-blue-500/25 text-blue-400 shrink-0">
                    <CalendarPlus size={14} weight="bold" />
                  </div>
                  <span className="text-[12px] font-bold text-neutral-200 truncate">
                    {!modalForm.isUnscheduled
                      ? `${modalForm.startTime} • ${modalForm.durationMinutes}m`
                      : 'Backlog Task'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleModalSubmit} className="flex flex-col gap-2.5">
                {/* Title Input */}
                <input
                  required
                  autoFocus
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="Task title (Enter to save)..."
                  style={heavyInputStyle}
                  className="w-full rounded-xl px-3 py-2 text-[13px] text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-blue-500/70 transition-all font-medium"
                />

                {/* Date & Time Row (if scheduled) */}
                {!modalForm.isUnscheduled && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={modalForm.date}
                      onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                      style={heavyInputStyle}
                      className="w-full rounded-lg px-2.5 py-1 text-[11px] text-neutral-300 outline-none font-mono cursor-pointer"
                    />
                    <input
                      type="time"
                      step="900"
                      value={modalForm.startTime}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, startTime: e.target.value })
                      }
                      style={heavyInputStyle}
                      className="w-full rounded-lg px-2.5 py-1 text-[11px] text-neutral-300 outline-none font-mono cursor-pointer"
                    />
                  </div>
                )}

                {/* Duration Presets */}
                {!modalForm.isUnscheduled && (
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                      Duration
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: '15m', val: 15 },
                        { label: '30m', val: 30 },
                        { label: '45m', val: 45 },
                        { label: '1h', val: 60 },
                        { label: '2h', val: 120 },
                      ].map((d) => (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => setModalForm({ ...modalForm, durationMinutes: d.val })}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            modalForm.durationMinutes === d.val
                              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
                              : 'text-neutral-400 hover:text-white bg-[#070707] border border-white/[0.04]'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority Selector */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                    Priority
                  </span>
                  <div
                    style={heavyInputStyle}
                    className="p-0.5 rounded-xl flex items-center gap-0.5"
                  >
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
                        title={`${item.label} Priority`}
                        className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          modalForm.priority === item.p
                            ? 'bg-white/15 text-white shadow-sm border border-white/20'
                            : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Backlog Toggle */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[11px] text-neutral-300 font-medium">
                    Save to Backlog
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setModalForm({ ...modalForm, isUnscheduled: !modalForm.isUnscheduled })
                    }
                    className={`w-8 h-4.5 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                      modalForm.isUnscheduled ? 'bg-[#0A84FF]' : 'bg-[#2A2A2E]'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform ${
                        modalForm.isUnscheduled ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl font-semibold text-[12px] bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95 cursor-pointer"
                  >
                    <Check size={14} weight="bold" />
                    <span>Schedule Task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-2 px-3 rounded-xl font-medium text-[12px] text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button (Quick Add Task) */}
      {isMobile && view !== 'life' && (
        <button
          onClick={() => handleOpenAddModal(selectedDate || currentDate)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#3B82F6] hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-[0_8px_28px_rgba(59,130,246,0.55)] z-40 transition-all cursor-pointer border border-blue-400/40"
          title="Add Task"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default CalendarContainer;
