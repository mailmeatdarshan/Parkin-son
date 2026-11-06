import React, { useState, useMemo } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { isSameDay } from '../../utils/calendarLayout';

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

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatHours = (h) => {
  if (!h || h <= 0) return '0m';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
};

const YearView = ({
  currentDate,
  selectedDate,
  tasks = [],
  heatmapEnabled = false,
  heatmapData = [],
  onSelectMonth,
  onDayClick,
  onDayDoubleClick,
  onTaskMove,
  onQuickAddTask,
}) => {
  const year = currentDate.getFullYear();
  const today = new Date();
  const [hoveredDateKey, setHoveredDateKey] = useState(null);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);

  // Focus hours map from dashboard heatmap
  const sessionHoursMap = useMemo(() => {
    const map = {};
    if (heatmapData && Array.isArray(heatmapData)) {
      heatmapData.forEach((d) => {
        if (d && d.date) {
          map[d.date] = d.hours || 0;
        }
      });
    }
    return map;
  }, [heatmapData]);

  // Tasks map for fast lookup across the full year
  const tasksByDateMap = useMemo(() => {
    const map = {};
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach((t) => {
        if (!t || !t.startDate) return;
        const d = new Date(t.startDate);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          if (!map[key]) map[key] = [];
          map[key].push(t);
        }
      });
    }
    return map;
  }, [tasks]);

  // Calibrate activity intensity per user specification:
  // None: 0 task, 0 focus
  // Light: <= 2 tasks or < 2 hr focus
  // Moderate: <= 4 tasks or < 4 hr focus
  // Heavy: <= 6 tasks or < 6 hr focus (or up to 9)
  // Peak: 10+ tasks or 10+ hr focus
  const getDayActivity = (cellDate) => {
    const dateKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
    const dayTasks = tasksByDateMap[dateKey] || [];
    const taskCount = dayTasks.length;

    const yyyy = cellDate.getFullYear();
    const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
    const dd = String(cellDate.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const focusHours = sessionHoursMap[isoDate] || 0;

    let intensity = 0;
    let label = 'None';

    if (taskCount === 0 && focusHours === 0) {
      intensity = 0;
      label = 'No activity';
    } else if (taskCount >= 10 || focusHours >= 10) {
      intensity = 4;
      label = 'Peak';
    } else if (taskCount > 4 || focusHours >= 4) {
      intensity = 3;
      label = 'Heavy';
    } else if (taskCount > 2 || focusHours >= 2) {
      intensity = 2;
      label = 'Moderate';
    } else {
      intensity = 1;
      label = 'Light';
    }

    return { taskCount, focusHours, intensity, label };
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  // Day Drag Over / Leave
  const handleDayDragOver = (e, dateKey) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredDateKey !== dateKey) {
      setHoveredDateKey(dateKey);
    }
  };

  const handleDayDragLeave = (e, dateKey) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (hoveredDateKey === dateKey) {
        setHoveredDateKey(null);
      }
    }
  };

  // Month Card Drag Over / Leave
  const handleMonthDragOver = (e, monthIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredMonthIndex !== monthIndex) {
      setHoveredMonthIndex(monthIndex);
    }
  };

  const handleMonthDragLeave = (e, monthIndex) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (hoveredMonthIndex === monthIndex) {
        setHoveredMonthIndex(null);
      }
    }
  };

  // Drop onto a specific day cell
  const handleDayDrop = (e, cellDate) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredDateKey(null);
    setHoveredMonthIndex(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (!data.taskId) return;

      const newStartDate = new Date(cellDate);
      if (data.originalDate) {
        const orig = new Date(data.originalDate);
        if (!isNaN(orig.getTime())) {
          newStartDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
        } else {
          newStartDate.setHours(9, 0, 0, 0);
        }
      } else {
        newStartDate.setHours(9, 0, 0, 0);
      }

      const durationMinutes = data.durationMinutes || 30;
      const newDueDate = new Date(newStartDate.getTime() + durationMinutes * 60000);

      if (onTaskMove) {
        onTaskMove(data.taskId, newStartDate, newDueDate);
      }
    } catch (err) {
      console.error('Error dropping task on year view day:', err);
    }
  };

  // Drop onto month card (fallback to today or 1st of month)
  const handleMonthDrop = (e, monthIndex) => {
    e.preventDefault();
    setHoveredDateKey(null);
    setHoveredMonthIndex(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (!data.taskId) return;

      const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === monthIndex;
      const targetDay = isCurrentMonth ? today.getDate() : 1;
      const targetDate = new Date(year, monthIndex, targetDay);

      if (data.originalDate) {
        const orig = new Date(data.originalDate);
        if (!isNaN(orig.getTime())) {
          targetDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
        } else {
          targetDate.setHours(9, 0, 0, 0);
        }
      } else {
        targetDate.setHours(9, 0, 0, 0);
      }

      const durationMinutes = data.durationMinutes || 30;
      const newDueDate = new Date(targetDate.getTime() + durationMinutes * 60000);

      if (onTaskMove) {
        onTaskMove(data.taskId, targetDate, newDueDate);
      }
    } catch (err) {
      console.error('Error dropping task on month card:', err);
    }
  };

  const renderMiniMonth = (monthIndex) => {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const firstDay = getFirstDayOfMonth(year, monthIndex);
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();

    const isCurrentMonth =
      today.getFullYear() === year && today.getMonth() === monthIndex;
    const currentDayNum = today.getDate();

    const cells = [];

    // HEATMAP MODE: Tightly packed contiguous mosaic matching reference image
    if (heatmapEnabled) {
      // Empty placeholder cells before 1st of month (invisible spacer)
      for (let i = 0; i < firstDay; i++) {
        cells.push(
          <div key={`empty-prev-${i}`} className="aspect-square w-full pointer-events-none" />
        );
      }

      // Current month days as tight square tiles
      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === currentDayNum;
        const cellDate = new Date(year, monthIndex, day);
        const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
        const dateKey = `${year}-${monthIndex}-${day}`;
        const isHovered = hoveredDateKey === dateKey;

        const activity = getDayActivity(cellDate);

        // User palette:
        // 0 - #E5E8F7
        // 1 - #C6CEF0
        // 2 - #AAB9ED
        // 3 - #819BE8
        // 4 - #5278E8
        let cellStyleClass = '';
        let textStyleClass = 'text-[#151932] font-semibold';

        if (activity.intensity === 0) {
          cellStyleClass = 'bg-[#E5E8F7] text-[#151932]';
          textStyleClass = 'text-[#151932] font-semibold';
        } else if (activity.intensity === 1) {
          cellStyleClass = 'bg-[#C6CEF0] text-[#151932]';
          textStyleClass = 'text-[#151932] font-semibold';
        } else if (activity.intensity === 2) {
          cellStyleClass = 'bg-[#AAB9ED] text-[#151932]';
          textStyleClass = 'text-[#151932] font-bold';
        } else if (activity.intensity === 3) {
          cellStyleClass = 'bg-[#819BE8] text-white shadow-[0_0_8px_rgba(129,155,232,0.4)]';
          textStyleClass = 'text-white font-bold';
        } else {
          cellStyleClass = 'bg-[#5278E8] text-white shadow-[0_0_12px_rgba(82,120,232,0.8)]';
          textStyleClass = 'text-white font-black';
        }

        if (isToday) {
          cellStyleClass += ' ring-2 ring-[#FF3B30] ring-offset-1 ring-offset-[#1A1A1C] z-20';
        } else if (isSelected) {
          cellStyleClass += ' ring-2 ring-white ring-offset-1 ring-offset-[#1A1A1C] z-20';
        }

        if (isHovered) {
          cellStyleClass += ' ring-2 ring-blue-400 scale-110 z-30 shadow-lg';
        }

        const cellTitle = `${MONTH_NAMES[monthIndex]} ${day}, ${year}\n• ${activity.taskCount} task${activity.taskCount === 1 ? '' : 's'} scheduled\n• ${formatHours(activity.focusHours)} focus logged\n• Activity: ${activity.label}`;

        cells.push(
          <div
            key={`curr-${day}`}
            onDragOver={(e) => handleDayDragOver(e, dateKey)}
            onDragLeave={(e) => handleDayDragLeave(e, dateKey)}
            onDrop={(e) => handleDayDrop(e, cellDate)}
            onClick={(e) => {
              e.stopPropagation();
              if (onDayClick) onDayClick(cellDate);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (onDayDoubleClick) onDayDoubleClick(cellDate);
            }}
            title={cellTitle}
            className={`aspect-square w-full rounded-[3px] flex items-center justify-center cursor-pointer select-none transition-all duration-100 ${cellStyleClass}`}
          >
            <span className={`text-[10px] md:text-[11px] font-sans leading-none select-none ${textStyleClass}`}>
              {day}
            </span>
          </div>
        );
      }

      return cells;
    }

    // STANDARD CALENDAR MODE (when heatmap is disabled)
    // Previous month padding days
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(
        <div
          key={`prev-${i}`}
          className="flex justify-center items-center pointer-events-none h-6"
        >
          <span className="text-[10px] md:text-[11px] font-semibold text-[#48484A]">
            {prevMonthDays - i}
          </span>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === currentDayNum;
      const cellDate = new Date(year, monthIndex, day);
      const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
      const dateKey = `${year}-${monthIndex}-${day}`;
      const isHovered = hoveredDateKey === dateKey;

      const activity = getDayActivity(cellDate);
      const hasEvents = activity.taskCount > 0;

      let cellStyleClass = '';
      let textStyleClass = '';

      if (isToday) {
        cellStyleClass = 'bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] text-white shadow-[0_0_10px_rgba(255,59,48,0.5)] font-bold';
        textStyleClass = 'text-white font-bold';
      } else if (isSelected) {
        cellStyleClass = 'bg-blue-500/25 ring-1 ring-blue-400 text-blue-300 font-bold';
        textStyleClass = 'text-blue-300 font-bold';
      } else if (hasEvents) {
        cellStyleClass = 'bg-white/[0.08] group-hover/cell:bg-white/[0.18] text-white font-bold shadow-sm';
        textStyleClass = 'text-white font-bold';
      } else {
        cellStyleClass = 'text-[#EBEBF5] group-hover/cell:bg-white/[0.08]';
        textStyleClass = 'text-[#EBEBF5]';
      }

      if (isHovered) {
        cellStyleClass += ' ring-2 ring-blue-400 bg-blue-600/50 scale-125 shadow-[0_0_12px_rgba(59,130,246,0.8)] z-30';
        textStyleClass = 'text-white font-extrabold';
      }

      const cellTitle = `${MONTH_NAMES[monthIndex]} ${day}, ${year} (Click to view tasks, double-click for day view)`;

      cells.push(
        <div
          key={`curr-${day}`}
          onDragOver={(e) => handleDayDragOver(e, dateKey)}
          onDragLeave={(e) => handleDayDragLeave(e, dateKey)}
          onDrop={(e) => handleDayDrop(e, cellDate)}
          className="flex justify-center items-center cursor-pointer relative z-10 group/cell h-6"
          onClick={(e) => {
            e.stopPropagation();
            if (onDayClick) onDayClick(cellDate);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onDayDoubleClick) onDayDoubleClick(cellDate);
          }}
          title={cellTitle}
        >
          <div
            className={`relative flex justify-center items-center w-5 h-5 md:w-6 md:h-6 transition-all rounded-full ${cellStyleClass}`}
          >
            <span
              className={`relative z-10 w-full h-full flex items-center justify-center text-[10px] md:text-[11px] transition-all rounded-full ${textStyleClass}`}
            >
              {day}
            </span>
          </div>
        </div>
      );
    }

    // Next month padding days to fill 42 cells (6 rows)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push(
        <div
          key={`next-${i}`}
          className="flex justify-center items-center pointer-events-none h-6"
        >
          <span className="text-[10px] md:text-[11px] font-semibold text-[#48484A]">
            {i}
          </span>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 md:gap-6 min-h-0 pb-12 bg-[#1E1E1E] select-none">
      {/* Activity Heatmap Header Legend when enabled */}
      {heatmapEnabled && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141416] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#5278E8] shadow-[0_0_10px_rgba(82,120,232,0.9)] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-bold text-white tracking-wide">Year Activity Heatmap</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#5278E8]/20 text-[#AAB9ED] border border-[#5278E8]/30">Active</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                Workload & focus intensity across {year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span className="text-neutral-500">Less</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0C0C0E] rounded-xl border border-white/[0.08]">
              <div className="w-3.5 h-3.5 rounded-[4px] bg-[#E5E8F7] border border-black/10" title="None: 0 tasks, 0h focus" />
              <div className="w-3.5 h-3.5 rounded-[4px] bg-[#C6CEF0] border border-black/10" title="Light: <= 2 tasks or < 2h focus" />
              <div className="w-3.5 h-3.5 rounded-[4px] bg-[#AAB9ED] border border-black/10" title="Moderate: <= 4 tasks or < 4h focus" />
              <div className="w-3.5 h-3.5 rounded-[4px] bg-[#819BE8] border border-black/10" title="Heavy: <= 6 tasks or < 6h focus" />
              <div className="w-3.5 h-3.5 rounded-[4px] bg-[#5278E8] shadow-[0_0_8px_rgba(82,120,232,0.8)]" title="Peak: 10+ tasks or 10+ hrs focus" />
            </div>
            <span className="text-neutral-300 font-bold">More</span>
          </div>
        </div>
      )}

      {/* 12 Months Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {MONTH_NAMES.map((month, idx) => {
          const isHoveredMonth = hoveredMonthIndex === idx;

          return (
            <div
              key={month}
              onDragOver={(e) => handleMonthDragOver(e, idx)}
              onDragLeave={(e) => handleMonthDragLeave(e, idx)}
              onDrop={(e) => handleMonthDrop(e, idx)}
              className={`flex flex-col group bg-[#1A1A1C]/50 hover:bg-[#1A1A1C]/90 border border-white/[0.04] hover:border-white/[0.1] p-3 md:p-4 rounded-[16px] md:rounded-[20px] transition-all duration-200 shadow-sm relative ${
                isHoveredMonth ? 'ring-2 ring-blue-500/80 bg-blue-500/15 shadow-xl' : ''
              }`}
            >
              {/* Month Header */}
              <div className="flex items-center justify-between mb-2 md:mb-3 pl-1">
                <button
                  type="button"
                  onClick={() => onSelectMonth && onSelectMonth(idx)}
                  className={`font-extrabold text-[15px] md:text-[18px] transition-colors drop-shadow-sm flex items-center gap-1 cursor-pointer ${
                    heatmapEnabled
                      ? 'text-white hover:text-blue-400'
                      : 'text-[#FF3B30] hover:text-[#FF453A]'
                  }`}
                  title={`Open ${month} in Month View`}
                >
                  {heatmapEnabled ? month.slice(0, 3) : month}
                </button>

                {!heatmapEnabled && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isCurrentMonth =
                          today.getFullYear() === year && today.getMonth() === idx;
                        const targetDate = isCurrentMonth
                          ? today
                          : new Date(year, idx, 1);
                        if (onQuickAddTask) {
                          onQuickAddTask(targetDate);
                        }
                      }}
                      className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer"
                      title={`Add task in ${month}`}
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectMonth && onSelectMonth(idx)}
                      className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                      title={`Open ${month} in Month View`}
                    >
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              {/* Days of Week Header - hidden in heatmap mode to match tight mosaic aesthetic */}
              {!heatmapEnabled && (
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_HEADER.map((d, i) => (
                    <div
                      key={`header-${i}`}
                      className="text-center text-[9px] md:text-[10px] font-bold text-neutral-500"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}

              {/* Days Matrix */}
              <div
                className={`grid grid-cols-7 ${
                  heatmapEnabled ? 'gap-[1.5px] sm:gap-[2px]' : 'gap-1'
                }`}
              >
                {renderMiniMonth(idx)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(YearView);
