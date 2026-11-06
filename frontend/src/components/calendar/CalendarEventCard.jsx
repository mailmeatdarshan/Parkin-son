import React, { useState, useRef, useEffect } from 'react';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import {
  getPriorityMeta,
  formatTimeRange,
  HOUR_HEIGHT,
  SLOT_HEIGHT,
  formatTime24,
} from '../../utils/calendarLayout';

const CalendarEventCard = ({
  layoutItem,
  decryptedTitle,
  isMobile = false,
  onTaskMove,
  onTaskResize,
  onTaskToggle,
  onTaskClick,
}) => {
  const {
    event: task,
    top,
    height: initialHeight,
    leftPercent,
    widthPercent,
    startMinutes,
    durationMinutes: initialDuration,
  } = layoutItem;

  const [isResizing, setIsResizing] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(initialHeight);
  const [currentDuration, setCurrentDuration] = useState(initialDuration);

  // Sync state if props change when not actively resizing
  useEffect(() => {
    if (!isResizing) {
      setCurrentHeight(initialHeight);
      setCurrentDuration(initialDuration);
    }
  }, [initialHeight, initialDuration, isResizing]);

  const priorityMeta = getPriorityMeta(task.priority);

  // Drag start handler for moving event
  const handleDragStart = (e) => {
    if (isResizing || task.status) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    const dragPayload = {
      type: 'calendar_event',
      taskId: task._id,
      durationMinutes: currentDuration,
      originalDate: task.startDate,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Bottom handle resize handler
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startY = e.clientY;
    const startDuration = currentDuration;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMinutes = Math.round(deltaY / SLOT_HEIGHT) * 15;
      const newDuration = Math.max(15, startDuration + deltaMinutes);
      const newHeight = Math.max(20, (newDuration / 60) * HOUR_HEIGHT);

      setCurrentDuration(newDuration);
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);

      const deltaY = upEvent.clientY - startY;
      const deltaMinutes = Math.round(deltaY / SLOT_HEIGHT) * 15;
      const finalDuration = Math.max(15, startDuration + deltaMinutes);

      if (finalDuration !== initialDuration && onTaskResize) {
        onTaskResize(task, finalDuration);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Compute live end date for display during resize
  const startTime = new Date(task.startDate);
  const liveEndTime = new Date(startTime.getTime() + currentDuration * 60000);
  const timeBadge = `${formatTime24(startTime)} - ${formatTime24(liveEndTime)}`;

  const isShort = currentHeight < 36;
  const isCompact = currentHeight < 56;

  const isCompleted = Boolean(task.status);
  const displayTitle = decryptedTitle || task.title || 'Untitled Task';

  return (
    <div
      draggable={!isResizing && !isCompleted}
      onDragStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        if (onTaskClick) onTaskClick(task);
      }}
      style={{
        top: `${top}px`,
        height: `${currentHeight}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
        borderLeftColor: isCompleted ? '#71717A' : priorityMeta.color,
      }}
      title={isCompleted ? `${displayTitle} (Completed - cannot be moved)` : undefined}
      className={`absolute z-20 group rounded-md border-l-[3.5px] border border-white/[0.08] select-none overflow-hidden flex flex-col justify-between transition-all ${
        isCompleted
          ? 'bg-[#202023] opacity-85 cursor-default hover:bg-[#252528]'
          : 'bg-[#242426]/95 hover:bg-[#2C2C2E] cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md'
      } ${isResizing ? 'ring-2 ring-blue-500/80 shadow-lg' : ''}`}
    >
      <div className={`${isMobile ? 'p-2' : 'p-1.5'} flex flex-col min-h-0 flex-1 ${isShort ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTaskToggle && onTaskToggle(task);
            }}
            className="text-neutral-400 hover:text-white shrink-0 transition-colors cursor-pointer"
          >
            {isCompleted ? (
              <CheckCircle2 size={isMobile ? 15 : 13} className="text-emerald-400" />
            ) : (
              <Circle size={isMobile ? 15 : 13} />
            )}
          </button>
          <span
            className={`${isMobile ? 'text-[13px]' : 'text-[12px]'} font-semibold truncate leading-tight ${
              isCompleted ? 'line-through text-neutral-300 decoration-neutral-500/80' : 'text-white/95'
            }`}
          >
            {displayTitle}
          </span>
        </div>

        {!isShort && (
          <div className={`flex items-center gap-1 ${isMobile ? 'text-[11px]' : 'text-[10px]'} text-neutral-400 mt-0.5 truncate font-medium`}>
            <Clock size={isMobile ? 11 : 10} className="shrink-0" />
            <span>{timeBadge}</span>
          </div>
        )}
      </div>

      {/* Bottom resize handle - only active when task is not completed */}
      {!isCompleted && (
        <div
          onMouseDown={handleResizeStart}
          className="w-full h-2 cursor-ns-resize hover:bg-blue-500/40 active:bg-blue-500/70 shrink-0 transition-colors flex items-center justify-center group-hover:opacity-100 opacity-60"
          title="Drag to resize (15m increments)"
        >
          <div className="w-6 h-[2px] rounded-full bg-white/30 group-hover:bg-white/70" />
        </div>
      )}
    </div>
  );
};

export default React.memo(CalendarEventCard);
