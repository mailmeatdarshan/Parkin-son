import React, { useState, useMemo } from 'react';
import {
  isSameDay,
  getPriorityMeta,
} from '../../utils/calendarLayout';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MonthView = ({
  currentDate,
  selectedDate,
  tasks,
  onDayClick,
  onDayDoubleClick,
  onTaskClick,
  onTaskMove,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const matrix = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();

    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells = [];

    // Previous month padding days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateObj = new Date(year, month - 1, d);
      cells.push({
        date: dateObj,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      cells.push({
        date: dateObj,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding days to fill 35 or 42 cells
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      cells.push({
        date: dateObj,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  const today = new Date();

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredIndex !== idx) {
      setHoveredIndex(idx);
    }
  };

  const handleDragLeave = (e, idx) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (hoveredIndex === idx) {
        setHoveredIndex(null);
      }
    }
  };

  const handleDrop = (e, cellDate) => {
    e.preventDefault();
    setHoveredIndex(null);

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
      console.error('Error dropping task on month cell:', err);
    }
  };

  const handlePillDragStart = (e, task) => {
    if (task.status) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    const durationMinutes =
      task.dueDate && task.startDate
        ? Math.max(
            15,
            Math.round(
              (new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / 60000
            )
          )
        : 30;

    const payload = {
      type: 'calendar_event',
      taskId: task._id,
      durationMinutes,
      title: task.title,
      priority: task.priority,
      originalDate: task.startDate,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E] select-none">
      {/* Day of Week Header */}
      <div className="grid grid-cols-7 shrink-0 border-b border-[#38383A] bg-[#1E1E1E]">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-[12px] font-bold tracking-wider text-neutral-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div
        className="flex-1 grid grid-cols-7 divide-x divide-y divide-[#38383A] border-b border-[#38383A] min-h-0"
        style={{ gridTemplateRows: `repeat(${matrix.length / 7}, minmax(0, 1fr))` }}
      >
        {matrix.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate && isSameDay(cell.date, selectedDate);
          const isHovered = hoveredIndex === idx;

          const dayTasks = tasks.filter((t) => {
            if (!t.startDate) return false;
            return isSameDay(new Date(t.startDate), cell.date);
          });

          return (
            <div
              key={idx}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={(e) => handleDragLeave(e, idx)}
              onDrop={(e) => handleDrop(e, cell.date)}
              onClick={() => onDayClick && onDayClick(cell.date)}
              onDoubleClick={() => onDayDoubleClick && onDayDoubleClick(cell.date)}
              title="Click to view tasks in Arrange Drawer | Double-click to open Day View"
              className={`p-1.5 flex flex-col min-h-0 cursor-pointer transition-all group overflow-hidden relative ${
                isHovered
                  ? 'bg-blue-500/20 ring-1 ring-blue-400/60 z-20 shadow-md'
                  : isSelected
                  ? 'bg-blue-500/[0.06] ring-1 ring-blue-500/30 z-10'
                  : cell.isCurrentMonth
                  ? 'bg-[#1E1E1E] hover:bg-[#252528]'
                  : 'bg-[#161617] opacity-40 hover:opacity-80 hover:bg-[#202022]'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between shrink-0 mb-1">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold transition-all ${
                    isToday
                      ? 'bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] text-white font-bold shadow-[0_0_10px_rgba(255,59,48,0.5)]'
                      : isSelected
                      ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30'
                      : cell.isCurrentMonth
                      ? 'text-[#EBEBF5] group-hover:text-white'
                      : 'text-neutral-500'
                  }`}
                >
                  {cell.dayNumber}
                </div>

                {dayTasks.length > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-blue-500/15 text-blue-300/80'
                        : 'text-neutral-400 bg-white/[0.05]'
                    }`}
                  >
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Event Pills (Draggable) */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto hide-scrollbar min-h-0">
                {dayTasks.slice(0, 3).map((task) => {
                  const priorityMeta = getPriorityMeta(task.priority);
                  const isCompleted = Boolean(task.status);

                  return (
                    <div
                      key={task._id}
                      draggable={!isCompleted}
                      onDragStart={(e) => handlePillDragStart(e, task)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick && onTaskClick(task);
                      }}
                      className={`px-1.5 py-0.5 rounded border flex items-center gap-1.5 truncate text-[11px] transition-all ${
                        isCompleted
                          ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.06] text-neutral-300 line-through decoration-neutral-500/80 cursor-default opacity-85'
                          : 'bg-white/[0.06] hover:bg-white/[0.14] border-white/[0.05] text-white/95 cursor-grab active:cursor-grabbing'
                      }`}
                      title={
                        isCompleted
                          ? `${task.title} (Completed - cannot be moved)`
                          : `${task.title} (drag to another date)`
                      }
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isCompleted ? '#A1A1AA' : priorityMeta.color,
                        }}
                      />
                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <span className="text-[10px] font-bold text-neutral-400 pl-1">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(MonthView);
