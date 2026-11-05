import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HOUR_HEIGHT,
  SLOT_HEIGHT,
  TOTAL_DAY_HEIGHT,
  getWeekDays,
  isSameDay,
  setHoursAndMinutes,
  computeDayLayout,
  formatTime24,
  offsetYToSnappedMinutes,
} from '../../utils/calendarLayout';
import CalendarEventCard from './CalendarEventCard';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WeekView = ({
  currentDate,
  tasks,
  onTaskMove,
  onTaskResize,
  onTaskToggle,
  onTaskClick,
  onDaySelect,
}) => {
  const containerRef = useRef(null);
  const [hoverGuide, setHoverGuide] = useState(null); // { dayIndex, slotMinutes }
  const [now, setNow] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Compute 7 days of current week (Monday to Sunday)
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Scroll to current hour or 8 AM on mount / date change
  useEffect(() => {
    if (containerRef.current) {
      const isCurrentWeek = weekDays.some((d) => isSameDay(d, new Date()));
      const targetHour = isCurrentWeek ? Math.max(0, new Date().getHours() - 1) : 8;
      containerRef.current.scrollTop = targetHour * HOUR_HEIGHT;
    }
  }, [weekDays]);

  // Handle Drag Over a column
  const handleDragOver = (e, dayIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const colRect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - colRect.top;
    const snappedMinutes = offsetYToSnappedMinutes(offsetY);

    setHoverGuide({ dayIndex, slotMinutes: snappedMinutes });
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setHoverGuide(null);
    }
  };

  // Handle Drop on a column
  const handleDrop = (e, dayDate) => {
    e.preventDefault();
    setHoverGuide(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      const colRect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - colRect.top;
      const startMinutes = offsetYToSnappedMinutes(offsetY);

      const durationMinutes = data.durationMinutes || 30;
      const startDate = setHoursAndMinutes(dayDate, startMinutes);
      const dueDate = new Date(startDate.getTime() + durationMinutes * 60000);

      if (onTaskMove) {
        onTaskMove(data.taskId, startDate, dueDate);
      }
    } catch (err) {
      console.error('Error handling drop on week view:', err);
    }
  };

  // Compute Current Time Indicator line position
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTop = (currentMinutes / 60) * HOUR_HEIGHT;
  const currentTimeString = formatTime24(now);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E] select-none">
      {/* Week Header Row */}
      <div className="flex shrink-0 border-b border-[#38383A] bg-[#1E1E1E] z-30">
        {/* Empty spacer for time gutter */}
        <div className="w-16 shrink-0 border-r border-[#38383A] text-right pr-2 py-3 text-[11px] font-semibold text-neutral-500">
          GMT
        </div>

        {/* 7 Day Headers */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-[#38383A]">
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, now);
            const isSelected = isSameDay(day, currentDate);

            return (
              <div
                key={idx}
                onClick={() => onDaySelect && onDaySelect(day)}
                className={`py-2 px-1 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-white/[0.04] ${
                  isSelected ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {DAY_NAMES[idx]}
                </span>
                <div
                  className={`mt-1 w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                    isToday
                      ? 'bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] text-white shadow-[0_0_12px_rgba(255,59,48,0.5)]'
                      : 'text-[#EBEBF5]'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Timeline Grid */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-[#1A1A1C]"
      >
        <div className="flex relative" style={{ height: `${TOTAL_DAY_HEIGHT}px` }}>
          {/* Left Time Gutter */}
          <div className="w-16 shrink-0 border-r border-[#38383A] relative bg-[#1E1E1E] z-10">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="relative border-b border-[#38383A]/30 flex items-start justify-end pr-2.5"
              >
                <span className="text-[11px] font-medium text-neutral-400 -mt-2 bg-[#1E1E1E] px-1">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {/* Current Time in Red (No line across grid) */}
            {weekDays.some((d) => isSameDay(d, now)) && (
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

          {/* 7 Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-[#38383A] relative">
            {weekDays.map((dayDate, dayIdx) => {
              const isToday = isSameDay(dayDate, now);
              const dayLayout = computeDayLayout(tasks, dayDate);
              const isHovered = hoverGuide && hoverGuide.dayIndex === dayIdx;

              return (
                <div
                  key={dayIdx}
                  onDragOver={(e) => handleDragOver(e, dayIdx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayDate)}
                  className="relative h-full transition-colors"
                >
                  {/* Horizontal 1-Hour Lines & 15-Minute Guides */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-[#38383A]/40 relative"
                    >
                      {/* 15m subtle guide lines */}
                      <div
                        style={{ top: `${SLOT_HEIGHT}px` }}
                        className="absolute inset-x-0 border-b border-white/[0.03]"
                      />
                      <div
                        style={{ top: `${SLOT_HEIGHT * 2}px` }}
                        className="absolute inset-x-0 border-b border-white/[0.04]"
                      />
                      <div
                        style={{ top: `${SLOT_HEIGHT * 3}px` }}
                        className="absolute inset-x-0 border-b border-white/[0.03]"
                      />
                    </div>
                  ))}

                  {/* Hover Guide indicator */}
                  {isHovered && (
                    <div
                      style={{
                        top: `${(hoverGuide.slotMinutes / 60) * HOUR_HEIGHT}px`,
                        height: `${SLOT_HEIGHT * 2}px`, // default 30m slot preview
                      }}
                      className="absolute inset-x-1 z-10 rounded border-2 border-dashed border-blue-500/70 bg-blue-500/10 pointer-events-none flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-blue-400">
                        {String(Math.floor(hoverGuide.slotMinutes / 60)).padStart(2, '0')}:
                        {String(hoverGuide.slotMinutes % 60).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {/* Render Day Event Cards */}
                  {dayLayout.map((item) => (
                    <CalendarEventCard
                      key={item.event._id}
                      layoutItem={item}
                      onTaskMove={onTaskMove}
                      onTaskResize={onTaskResize}
                      onTaskToggle={onTaskToggle}
                      onTaskClick={onTaskClick}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(WeekView);
