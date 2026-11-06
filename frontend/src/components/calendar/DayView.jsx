import React, { useState, useEffect, useRef } from 'react';
import {
  HOUR_HEIGHT,
  SLOT_HEIGHT,
  TOTAL_DAY_HEIGHT,
  isSameDay,
  setHoursAndMinutes,
  computeDayLayout,
  formatTime24,
  offsetYToSnappedMinutes,
} from '../../utils/calendarLayout';
import CalendarEventCard from './CalendarEventCard';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayView = ({
  currentDate,
  tasks,
  decryptedTitles,
  onTaskMove,
  onTaskResize,
  onTaskToggle,
  onTaskClick,
  onTimeSlotClick,
  onQuickAddTask,
}) => {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [hoverGuide, setHoverGuide] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isToday = isSameDay(currentDate, now);

  // Scroll to current hour or 8 AM on mount / date change
  useEffect(() => {
    if (containerRef.current) {
      const targetHour = isToday ? Math.max(0, new Date().getHours() - 1) : 8;
      containerRef.current.scrollTop = targetHour * HOUR_HEIGHT;
    }
  }, [currentDate, isToday]);

  const handleDragOver = (e) => {
    isDraggingRef.current = true;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const colRect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - colRect.top;
    const snappedMinutes = offsetYToSnappedMinutes(offsetY);

    setHoverGuide({ slotMinutes: snappedMinutes });
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setHoverGuide(null);
      isDraggingRef.current = false;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setHoverGuide(null);
    isDraggingRef.current = true;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      const colRect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - colRect.top;
      const startMinutes = offsetYToSnappedMinutes(offsetY);

      const durationMinutes = data.durationMinutes || 30;
      const startDate = setHoursAndMinutes(currentDate, startMinutes);
      const dueDate = new Date(startDate.getTime() + durationMinutes * 60000);

      if (onTaskMove) {
        onTaskMove(data.taskId, startDate, dueDate);
      }
    } catch (err) {
      console.error('Error handling drop on day view:', err);
    }
  };

  const handleColumnClick = (e) => {
    if (isDraggingRef.current) return;
    const colRect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - colRect.top;
    const snappedMinutes = offsetYToSnappedMinutes(offsetY);
    const hours = Math.floor(snappedMinutes / 60);
    const mins = snappedMinutes % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const targetDate = setHoursAndMinutes(currentDate, snappedMinutes);

    const callback = onTimeSlotClick || onQuickAddTask;
    if (callback) {
      callback(targetDate, timeString, { x: e.clientX, y: e.clientY });
    }
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTop = (currentMinutes / 60) * HOUR_HEIGHT;
  const currentTimeString = formatTime24(now);

  const dayLayout = computeDayLayout(tasks, currentDate);

  const formattedHeader = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E] select-none">
      {/* Day Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#38383A] bg-[#1E1E1E] z-30">
        <div className="flex items-center gap-3">
          <span className="text-[16px] font-bold text-white">{formattedHeader}</span>
          {isToday && (
            <span className="bg-red-500/20 text-[#FF3B30] text-[11px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
              Today
            </span>
          )}
        </div>
        <span className="text-[12px] font-medium text-neutral-400">
          {dayLayout.length} scheduled {dayLayout.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Scrollable Timeline */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-[#1A1A1C]"
      >
        <div className="flex relative" style={{ height: `${TOTAL_DAY_HEIGHT}px` }}>
          {/* Left Time Gutter */}
          <div className="w-20 shrink-0 border-r border-[#38383A] relative bg-[#1E1E1E] z-10">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="relative border-b border-[#38383A]/30 flex items-start justify-end pr-3"
              >
                <span className="text-[11px] font-medium text-neutral-400 -mt-2 bg-[#1E1E1E] px-1">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {/* Current Time in Red (No line across grid) */}
            {isToday && (
              <div
                style={{ top: `${currentTop}px` }}
                className="absolute right-1 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-end"
              >
                <span className="text-[11px] font-bold text-[#FF3B30] bg-[#1E1E1E] px-1 rounded shadow-sm border border-[#FF3B30]/30">
                  {currentTimeString}
                </span>
              </div>
            )}
          </div>

          {/* Single Day Column */}
          <div
            onClick={handleColumnClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex-1 relative h-full transition-colors cursor-pointer group/col"
            title="Click any time slot to schedule a task"
          >
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#38383A]/40 relative hover:bg-white/[0.025] transition-colors"
              >
                <div
                  style={{ top: `${SLOT_HEIGHT}px` }}
                  className="absolute inset-x-0 border-b border-white/[0.03] pointer-events-none"
                />
                <div
                  style={{ top: `${SLOT_HEIGHT * 2}px` }}
                  className="absolute inset-x-0 border-b border-white/[0.04] pointer-events-none"
                />
                <div
                  style={{ top: `${SLOT_HEIGHT * 3}px` }}
                  className="absolute inset-x-0 border-b border-white/[0.03] pointer-events-none"
                />
              </div>
            ))}

            {/* Hover Guide */}
            {hoverGuide && (
              <div
                style={{
                  top: `${(hoverGuide.slotMinutes / 60) * HOUR_HEIGHT}px`,
                  height: `${SLOT_HEIGHT * 2}px`,
                }}
                className="absolute inset-x-4 z-10 rounded border-2 border-dashed border-blue-500/70 bg-blue-500/10 pointer-events-none flex items-center justify-center"
              >
                <span className="text-[11px] font-bold text-blue-400">
                  {String(Math.floor(hoverGuide.slotMinutes / 60)).padStart(2, '0')}:
                  {String(hoverGuide.slotMinutes % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Event Cards */}
            {dayLayout.map((item) => (
              <CalendarEventCard
                key={item.event._id}
                layoutItem={item}
                decryptedTitle={decryptedTitles?.[item.event._id]}
                onTaskMove={onTaskMove}
                onTaskResize={onTaskResize}
                onTaskToggle={onTaskToggle}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DayView);
