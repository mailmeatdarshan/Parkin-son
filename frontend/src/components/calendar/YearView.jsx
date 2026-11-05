import React, { useState } from 'react';
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

const YearView = ({
  currentDate,
  selectedDate,
  tasks = [],
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

      const hasEvents = tasks.some((t) => {
        if (!t.startDate) return false;
        return isSameDay(new Date(t.startDate), cellDate);
      });

      cells.push(
        <div
          key={`curr-${day}`}
          onDragOver={(e) => handleDayDragOver(e, dateKey)}
          onDragLeave={(e) => handleDayDragLeave(e, dateKey)}
          onDrop={(e) => handleDayDrop(e, cellDate)}
          className="flex justify-center items-center cursor-pointer relative z-10 group/cell h-6"
          onClick={(e) => {
            e.stopPropagation();
            if (onDayClick) {
              onDayClick(cellDate);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onDayDoubleClick) {
              onDayDoubleClick(cellDate);
            }
          }}
          title={`${MONTH_NAMES[monthIndex]} ${day}, ${year} (Click to view tasks, double-click for day view)`}
        >
          <div
            className={`relative flex justify-center items-center w-5 h-5 md:w-6 md:h-6 rounded-full transition-all ${
              isHovered
                ? 'ring-2 ring-blue-500 bg-blue-500/40 scale-125 shadow-[0_0_12px_rgba(59,130,246,0.8)] z-30'
                : isSelected && !isToday
                ? 'bg-blue-500/25 ring-1 ring-blue-400 text-blue-300 font-bold'
                : ''
            }`}
          >
            {hasEvents && !isToday && !isHovered && !isSelected && (
              <div className="absolute inset-0 rounded-full bg-white/[0.08] group-hover/cell:bg-white/[0.18] transition-colors shadow-sm" />
            )}

            <span
              className={`relative z-10 w-full h-full flex items-center justify-center rounded-full text-[10px] md:text-[11px] font-semibold transition-all ${
                isHovered
                  ? 'text-white font-extrabold'
                  : isToday
                  ? 'bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] text-white shadow-[0_0_10px_rgba(255,59,48,0.5)] font-bold'
                  : isSelected
                  ? 'text-blue-300 font-bold'
                  : hasEvents
                  ? 'text-white font-bold'
                  : 'text-[#EBEBF5] group-hover/cell:bg-white/[0.08]'
              }`}
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
    <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 min-h-0 pb-12 bg-[#1E1E1E] select-none">
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
                className="text-[#FF3B30] font-extrabold text-[15px] md:text-[18px] transition-colors hover:text-[#FF453A] drop-shadow-sm flex items-center gap-1 cursor-pointer"
                title={`Open ${month} in Month View`}
              >
                {month}
              </button>

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
            </div>

            {/* Days of Week Header */}
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

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {renderMiniMonth(idx)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(YearView);
