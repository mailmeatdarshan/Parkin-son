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
  decryptedTitles,
  isMobile = false,
  onTaskMove,
  onTaskResize,
  onTaskToggle,
  onTaskClick,
  onDaySelect,
  onTimeSlotClick,
  onQuickAddTask,
}) => {
  const containerRef = useRef(null);
  const scrollWrapperRef = useRef(null);
  const isDraggingRef = useRef(false);
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

  // Auto-scroll horizontally to today on mobile
  useEffect(() => {
    if (isMobile && scrollWrapperRef.current) {
      const todayIdx = weekDays.findIndex((d) => isSameDay(d, new Date()));
      if (todayIdx > 0) {
        const colWidth = (scrollWrapperRef.current.scrollWidth - 56) / 7;
        const targetX = todayIdx * colWidth - 24;
        scrollWrapperRef.current.scrollLeft = Math.max(0, targetX);
      }
    }
  }, [weekDays, isMobile]);

  // Handle Drag Over a column
  const handleDragOver = (e, dayIndex) => {
    isDraggingRef.current = true;
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
      isDraggingRef.current = false;
    }
  };

  // Handle Drop on a column
  const handleDrop = (e, dayDate) => {
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
      const startDate = setHoursAndMinutes(dayDate, startMinutes);
      const dueDate = new Date(startDate.getTime() + durationMinutes * 60000);

      if (onTaskMove) {
        onTaskMove(data.taskId, startDate, dueDate);
      }
    } catch (err) {
      console.error('Error handling drop on week view:', err);
    }
  };

  const handleColumnClick = (e, dayDate) => {
    if (isDraggingRef.current) return;
    const colRect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - colRect.top;
    const snappedMinutes = offsetYToSnappedMinutes(offsetY);
    const hours = Math.floor(snappedMinutes / 60);
    const mins = snappedMinutes % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const targetDate = setHoursAndMinutes(dayDate, snappedMinutes);

    const callback = onTimeSlotClick || onQuickAddTask;
    if (callback) {
      callback(targetDate, timeString, { x: e.clientX, y: e.clientY });
    }
  };

  // Compute Current Time Indicator line position
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTop = (currentMinutes / 60) * HOUR_HEIGHT;
  const currentTimeString = formatTime24(now);

  return (
    <div
      ref={scrollWrapperRef}
      className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E] select-none overflow-x-auto overflow-y-hidden"
    >
      <div className={`${isMobile ? 'min-w-[620px]' : 'min-w-[560px] sm:min-w-0'} flex-1 flex flex-col min-h-0`}>
        {/* Week Header Row */}
        <div className="flex shrink-0 border-b border-[#38383A] bg-[#1E1E1E] z-30">
          {/* Empty spacer for time gutter */}
          <div className="w-12 sm:w-16 shrink-0 border-r border-[#38383A] text-right pr-2 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-semibold text-neutral-500">
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
                      ? 'bg-[#3B82F6] text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
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
          <div className="w-12 sm:w-16 shrink-0 border-r border-[#38383A] relative bg-[#1E1E1E] z-10">
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

            {/* Current Time in Theme Blue */}
            {weekDays.some((d) => isSameDay(d, now)) && (
              <div
                style={{ top: `${currentTop}px` }}
                className="absolute right-1 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-end"
              >
                <span className="text-[11px] font-bold text-[#3B82F6] bg-[#1E1E1E] px-1 rounded shadow-sm border border-[#3B82F6]/30">
                  {currentTimeString}
                </span>
              </div>
            )}
          </div>

          {/* 7 Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-[#38383A] relative">
            {weekDays.map((dayDate, dayIdx) => {
              const dayLayout = computeDayLayout(tasks, dayDate);
              const isHovered = hoverGuide && hoverGuide.dayIndex === dayIdx;

              return (
                <div
                  key={dayIdx}
                  onClick={(e) => handleColumnClick(e, dayDate)}
                  onDragOver={(e) => handleDragOver(e, dayIdx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayDate)}
                  className="relative h-full transition-colors cursor-pointer group/col"
                  title={`Click to schedule task on ${DAY_NAMES[dayIdx]}, ${dayDate.getDate()} at this time`}
                >
                  {/* Horizontal 1-Hour Lines & 15-Minute Guides */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-[#38383A]/40 relative hover:bg-white/[0.025] transition-colors"
                    >
                      {/* 15m subtle guide lines */}
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
                      decryptedTitle={decryptedTitles?.[item.event._id]}
                      isMobile={isMobile}
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
    </div>
  );
};

export default React.memo(WeekView);
